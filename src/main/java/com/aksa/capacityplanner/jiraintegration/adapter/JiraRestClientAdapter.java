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
 * aykiri olurdu. Ayrica o donemde CIDDI BIR HATAYA da yol acmisti: cache o
 * zaman iki katmanliydi (Caffeine L1 + Redis L2) ve restart sonrasi L1 miss +
 * L2 hit olunca Redis.ten JSON olarak geri okunan List<JiraIssueSnapshot>,
 * record tipini kuramayip List<LinkedHashMap> donuyordu - senkronizasyon
 * ClassCastException ile sessizce hic gerceklesmiyordu (bkz. kullanici
 * bildirimi: "kuyruğa alındı diyor ama veri akışı gerçekleşmiyor"). Redis o
 * gunden beri kaldirildi (bkz. JvmCacheManager), ama bu metodun
 * cache.lenmeme gerekcesi yukaridaki BIRINCI sebep yuzunden aynen gecerli.
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
     * customfield_10503 (Efor A/DK, dakika) TUM takimlar icin birincil efor
     * kaynagidir (kullanicinin dogrulanmis formul dokumaniyla teyitli); SP
     * alanlari (10016/10057) sadece 10503 bossa fallback olarak kullanilir -
     * takima ozgu diger custom field'lar (Sektor, Departman vb.) Faz 0 kesfi
     * tamamlaninca eklenir.
     */
    private static final List<String> DEFAULT_FIELDS = List.of(
            "summary", "status", "assignee", "priority", "issuetype",
            "timeoriginalestimate", "timeestimate", "timespent",
            "aggregatetimeoriginalestimate", "aggregatetimespent",
            "created", "updated", "resolutiondate", "labels", "subtasks", "parent",
            JiraEstimationFieldMapper.EFFORT_MINUTES_FIELD_ID,
            JiraEstimationFieldMapper.STORY_POINTS_PRIMARY_FIELD_ID,
            JiraEstimationFieldMapper.STORY_POINTS_FALLBACK_FIELD_ID,
            // Icerik Slayti'nin "Jira'dan Cek" ile otomatik dolmasi icin (bkz.
            // JiraSyncProcessor, kullanici bildirimi 2026-08-17): Flagged
            // (customfield_10021) -> Riskler kutusu, Sektör (customfield_10498)
            // -> madde etiketi. Jira field discovery ile dogrulandi (schema.type):
            // Flagged=array/option (multicheckboxes), Sektör=option (select).
            "customfield_10021", "customfield_10498",
            // "Sprint" alani (Jira Software'in "gh-sprint" custom field tipi) -
            // HEDEFLER cubugunun guncel sprint'e ozgu sayilmasi icin (bkz.
            // JiraSyncProcessor.extractActiveSprint, kullanici bildirimi
            // 2026-08-17). customfield_10020, Jira Cloud'da scrum board'lar icin
            // bu alanin standart/varsayilan id'sidir (site kurulumunda otomatik
            // olusturulur); instance'da farkliysa GET /api/jira-discovery/fields
            // (schema.custom="com.pyxis.greenhopper.jira:gh-sprint") ile dogrulanip
            // burada guncellenmelidir.
            "customfield_10020");

    /** Yalnizca RPA icin: Jira'da bu label'i tasiyan isler, kisinin kendi (sirkete dahil olmayan) projesi oldugu icin kapsam disi. */
    private static final String RPA_OUT_OF_SCOPE_LABEL = "rpa";

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
     * ESKIDEN alt gorevler (Sub-task) varsayilan sorgudan TAMAMEN haric
     * tutuluyordu (issuetype != Sub-task) - RPA'da issue'larin buyuk kismi
     * (orn. 2197'nin 1622'si) alt gorev oldugundan, filtrelenmeden cekilince
     * dashboard toplam is kalemi sayisini gercek surec sayisinin NEREDEYSE 4
     * KATI gosteriyordu.
     *
     * ANCAK canli veri incelemesi (2026-08-14, kullanici bildirimi - "efor
     * lari epiclere ya da islere girmis olabilirler... subtasklara da
     * bakabilirsin") RPA, SD ve DA/DSYS'de AYNI deseni ortaya cikardi: gercek
     * kisi-bazli efor VE gercek assignee bilgisi COGUNLUKLA parent'ta degil
     * ALT GOREVLERDE tutuluyor - orn. SD-1733'un kendi customfield_10503'u BOS,
     * ama 4 alt gorevinde toplam 960 dakika (ve parent'tan FARKLI bir kisiye,
     * UMUT HAZIRAY'a atanmis) efor var. Alt gorevleri disarida birakmak bu
     * eforu ve kisi atamasini TAMAMEN kaybettiriyordu (SD'de "Tamamlanan"
     * kartinin herkeste 0 gorunmesinin bir nedeni de buydu). IZ ve YZ'de hic
     * alt gorev yok (canli dogrulandi, sayim=0), bu yuzden onlar icin bu
     * degisiklik etkisizdir.
     *
     * Bu yuzden artik TUM projelerde alt gorevler BILEREK DAHIL edilir; eski
     * "4 kat sisme" sorunu, JiraSyncProcessor'daki "alt gorevi olan
     * parent'in kendi eforunu 0 say" kuraliyla (cift sayimi onler, artik tum
     * projeler icin gecerli) ve is kalemi SAYISININ artik gercegi yansitmasiyla
     * (alt gorevler de gercek is kalemleridir) kabul edilebilir hale geldi.
     *
     * RPA'ya OZEL kalan tek kural: "labels" alaninda "rpa" etiketi olan isler,
     * kisinin sirkete dahil OLMAYAN kendi projesi oldugu icin kapsam disi
     * birakilir (bkz. kullanici bildirimi). DIKKAT: "labels NOT IN (x)" tek
     * basina yazilirsa, Jira'nin JQL semantiginde labels alani BOS/null olan
     * issue'lar da (SQL'deki "NULL NOT IN (...)" gibi) YANLISLIKLA disarida
     * kalir - canli testte RPA-2260 (hic etiketi olmayan, gercek bir parent)
     * bu yuzden sessizce elendigi tespit edildi. "OR labels IS EMPTY" ile
     * etiketsiz issue'lar acikca dahil edilir.
     */
    private String resolveJql(JiraFetchQuery query) {
        if (query.jql() != null && !query.jql().isBlank()) {
            return query.jql();
        }
        if ("RPA".equals(query.jiraProjectKey())) {
            return "project = RPA AND (labels NOT IN (" + RPA_OUT_OF_SCOPE_LABEL
                    + ") OR labels IS EMPTY) ORDER BY updated DESC";
        }
        return "project = " + query.jiraProjectKey() + " ORDER BY updated DESC";
    }

    /**
     * DA/DSYS/YZ gibi takimlarda Sektor (customfield_10498) Gorev/Alt Gorev
     * seviyesinde bos, sadece bagli Epic'te dolu (bkz. referans "Jira
     * Dashboard" projesinin jiraClient.js#resolveSectorFromEpic ile ayni
     * desen) - JiraSyncProcessor bu metodla o Epic'lerin kendi sektor
     * degerini tek seferde toplu getirir. 100'luk gruplar halinde sorgulanir
     * (Jira'nin "key in (...)" JQL ifadesi cok uzun bir liste icin pratik
     * olmayabilir - referans projeyle ayni chunk boyutu).
     */
    @Override
    @SuppressWarnings("unchecked")
    public Map<String, String> fetchSectorByIssueKeys(List<String> issueKeys) {
        Map<String, String> result = new LinkedHashMap<>();
        List<String> keys = issueKeys.stream().distinct().toList();
        for (int i = 0; i < keys.size(); i += PAGE_SIZE) {
            List<String> chunk = keys.subList(i, Math.min(i + PAGE_SIZE, keys.size()));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("jql", "key in (" + String.join(",", chunk) + ")");
            body.put("fields", List.of("customfield_10498"));
            body.put("maxResults", chunk.size());

            Map<String, Object> response = jiraRestClient.post()
                    .uri("/rest/api/3/search/jql")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                continue;
            }
            List<Map<String, Object>> issues = (List<Map<String, Object>>) response.getOrDefault("issues", List.of());
            for (Map<String, Object> issue : issues) {
                String key = String.valueOf(issue.get("key"));
                Map<String, Object> fields = (Map<String, Object>) issue.getOrDefault("fields", Map.of());
                Object sectorField = fields.get("customfield_10498");
                if (sectorField instanceof Map<?, ?> option) {
                    Object value = option.get("value");
                    if (value != null) {
                        result.put(key, String.valueOf(value));
                    }
                }
            }
        }
        return result;
    }

    /**
     * fetchSectorByIssueKeys ile AYNI "key in (...)" chunk deseni - tek fark
     * cekilen alan (labels, sabit bir dizi - option nesnesi degil) ve birden
     * fazla degerin virgulle birlestirilmesi. bkz. JiraGatewayPort'taki notu.
     */
    @Override
    @SuppressWarnings("unchecked")
    public Map<String, String> fetchLabelsByIssueKeys(List<String> issueKeys) {
        Map<String, String> result = new LinkedHashMap<>();
        List<String> keys = issueKeys.stream().distinct().toList();
        for (int i = 0; i < keys.size(); i += PAGE_SIZE) {
            List<String> chunk = keys.subList(i, Math.min(i + PAGE_SIZE, keys.size()));
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("jql", "key in (" + String.join(",", chunk) + ")");
            body.put("fields", List.of("labels"));
            body.put("maxResults", chunk.size());

            Map<String, Object> response = jiraRestClient.post()
                    .uri("/rest/api/3/search/jql")
                    .body(body)
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                continue;
            }
            List<Map<String, Object>> issues = (List<Map<String, Object>>) response.getOrDefault("issues", List.of());
            for (Map<String, Object> issue : issues) {
                String key = String.valueOf(issue.get("key"));
                Map<String, Object> fields = (Map<String, Object>) issue.getOrDefault("fields", Map.of());
                Object labelsField = fields.get("labels");
                if (labelsField instanceof List<?> labels && !labels.isEmpty()) {
                    String joined = labels.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse(null);
                    if (joined != null) {
                        result.put(key, joined);
                    }
                }
            }
        }
        return result;
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
