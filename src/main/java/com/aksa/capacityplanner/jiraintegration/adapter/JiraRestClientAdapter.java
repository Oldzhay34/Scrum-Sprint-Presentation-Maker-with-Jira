package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.jiraintegration.domain.JiraEstimationFieldMapper;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * jira.enabled=true oldugunda devreye giren gercek Jira REST adaptoru.
 * Kullanilan endpoint: POST /rest/api/3/search/jql (bkz. docs/jira-endpoint-plani.md, Faz 2).
 *
 * Eski /rest/api/3/search endpoint'i Atlassian tarafindan kaldirildigindan
 * sayfalama startAt yerine nextPageToken ile yapilir; yanit total dondurmez.
 *
 * BILEREK CACHE'LENMEZ (once @Cacheable("jira-issues") vardi, kaldirildi):
 * "senkronizasyon" eylemi tanim geregi HER ZAMAN Jira'dan TAZE veri cekmeli -
 * cache'lenirse ayni takim icin art arda tetiklenen bir sync, Jira'dan degil
 * eski sonuctan servis edilir ki bu "Jira'dan Çek" butonunun butun amacina
 * aykiri olurdu. Ayrica gercekte bir CIDDI HATAYA da yol acmisti: L1 (Caffeine,
 * JVM-ici) her backend restart'inda sifirlaniyor ama L2 (Redis) container'lar
 * arasi kalici - restart sonrasi L1 miss + L2 hit olunca, TwoLevelCache'in
 * Redis'ten JSON'dan geri okudugu List<JiraIssueSnapshot>, generic/record
 * tipini dogru geri kuramayip List<LinkedHashMap> olarak donuyor, bu da
 * JiraSyncRequestConsumer'da ClassCastException'a ve mesajin RabbitMQ DLQ'ya
 * dusup senkronizasyonun sessizce hic gerceklesmemesine yol aciyordu (bkz.
 * kullanici bildirimi: "kuyruğa alındı diyor ama veri akışı gerçekleşmiyor").
 * Discovery uc noktalari (JiraDiscoveryService) duz Map donduren, nadiren
 * degisen referans verisi oldugu icin cache'lenmeye devam eder - sorun sadece
 * ozel record tipi tasiyan bu metoda ozgudur.
 */
@Component
@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "true")
public class JiraRestClientAdapter implements JiraGatewayPort {

    private static final Logger log = LoggerFactory.getLogger(JiraRestClientAdapter.class);

    /**
     * Tek istekte cekilecek Jira alanlari. RPA/IZ board'lari zaman takibi
     * (timeoriginalestimate vb.) KULLANMIYOR - GET /rest/agile/1.0/board/{id}/configuration
     * ile dogrulandi: her ikisi de "estimation.type"="field" ile Story Points
     * benzeri bir custom field kullaniyor (bkz. JiraEstimationFieldMapper).
     * O yuzden zaman-takibi alanlarinin yaninda bu custom field id'leri de
     * (RPA: customfield_10057, IZ: customfield_10016) burada istenir - takima
     * ozgu diger custom field'lar (Sektor, Departman vb.) Faz 0 kesfi tamamlaninca eklenir.
     */
    private static final List<String> DEFAULT_FIELDS = List.of(
            "summary", "status", "assignee", "priority", "issuetype",
            "timeoriginalestimate", "timeestimate", "timespent",
            "aggregatetimeoriginalestimate", "aggregatetimespent",
            "created", "updated", "resolutiondate",
            JiraEstimationFieldMapper.RPA_STORY_POINTS_FIELD_ID,
            JiraEstimationFieldMapper.IZ_STORY_POINTS_FIELD_ID);

    private static final int PAGE_SIZE = 100;
    private static final int MAX_PAGES = 50; // guvenlik siniri: 50 * 100 = 5000 issue

    private final RestClient jiraRestClient;

    public JiraRestClientAdapter(RestClient jiraRestClient) {
        this.jiraRestClient = jiraRestClient;
    }

    @Override
    public List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query) {
        String jql = resolveJql(query);
        log.info("Jira'dan issue cekiliyor. jql={}", jql);

        List<JiraIssueSnapshot> result = new ArrayList<>();
        String nextPageToken = null;

        for (int page = 0; page < MAX_PAGES; page++) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("jql", jql);
            body.put("fields", DEFAULT_FIELDS);
            body.put("maxResults", PAGE_SIZE);
            if (nextPageToken != null) {
                body.put("nextPageToken", nextPageToken);
            }

            Map<String, Object> response = jiraRestClient.post()
                    .uri("/rest/api/3/search/jql")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                break;
            }

            List<Map<String, Object>> issues = (List<Map<String, Object>>) response.getOrDefault("issues", List.of());
            issues.forEach(issue -> result.add(toSnapshot(issue)));

            Object tokenValue = response.get("nextPageToken");
            boolean isLast = Boolean.TRUE.equals(response.get("isLast")) || tokenValue == null || issues.isEmpty();
            if (isLast) {
                break;
            }
            nextPageToken = String.valueOf(tokenValue);
        }

        log.info("Jira'dan {} issue cekildi. jql={}", result.size(), jql);
        return result;
    }

    /**
     * RPA projesinde issue'larin %74'u (2197 issue'nun 1622'si - canli olarak
     * dogrulandi) Alt Gorev (Sub-task). Bunlar filtrelenmeden cekilince RPA
     * takimi dashboard'da toplam is kalemi sayisini gercek surec sayisinin
     * (~575) NEREDEYSE 4 KATI olarak goruyordu - bkz. kullanici bildirimi
     * ("verilerin yanlis oldugunu soyluyorlar"). Alt gorevlerin coguu ayrica
     * kendi Story Points degerine sahip olmuyor (ust hikaye tasir), bu da
     * "efor hep 0" izlenimini guclendiriyordu. Story/Epic/Task/Bug seviyesi
     * IZ'de zaten problemsizdi (0 subtask), ama kural TUM projeler icin
     * genel olarak dogru: kapasite takibi hikaye/gorev seviyesinde yapilir,
     * alt gorevler kendi basina ayri bir "is kalemi" degildir.
     */
    private String resolveJql(JiraFetchQuery query) {
        if (query.jql() != null && !query.jql().isBlank()) {
            return query.jql();
        }
        return "project = " + query.jiraProjectKey() + " AND issuetype != Sub-task ORDER BY updated DESC";
    }

    @SuppressWarnings("unchecked")
    private JiraIssueSnapshot toSnapshot(Map<String, Object> issue) {
        String issueKey = String.valueOf(issue.get("key"));
        Map<String, Object> fields = (Map<String, Object>) issue.getOrDefault("fields", Map.of());

        String summary = String.valueOf(fields.getOrDefault("summary", ""));
        Map<String, Object> status = (Map<String, Object>) fields.get("status");
        String statusName = status != null ? String.valueOf(status.get("name")) : null;

        return new JiraIssueSnapshot(issueKey, summary, statusName, fields);
    }
}
