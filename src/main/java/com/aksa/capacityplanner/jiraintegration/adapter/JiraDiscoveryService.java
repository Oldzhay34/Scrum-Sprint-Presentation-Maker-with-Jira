package com.aksa.capacityplanner.jiraintegration.adapter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * docs/jira-endpoint-plani.md Faz 0 (kesif) cagrilari. API key tanimlandiginda
 * gercek customfield_XXXXX id'lerini, proje anahtarlarini ve statu/oncelik
 * listelerini uygulama uzerinden (Postman'e gerek kalmadan) gormek icin.
 *
 * Baglanan API key admin yetkisine sahip ve Jira'daki TUM projelere/board'lara
 * erisebiliyor - bu yuzden listAllBoards/listActiveSprintsAcrossAllTeams tek bir
 * takimla sinirli degil, instance genelindeki her takimi kapsar.
 *
 * Sonuclar iki katmanli cache'e (Caffeine L1 + Redis L2) yazilir; bu veriler
 * Jira tarafinda nadiren degistigi icin tekrar tekrar cekilmesine gerek yoktur.
 */
@Component
@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "true")
public class JiraDiscoveryService {

    private static final Logger log = LoggerFactory.getLogger(JiraDiscoveryService.class);

    private final RestClient jiraRestClient;

    public JiraDiscoveryService(RestClient jiraRestClient) {
        this.jiraRestClient = jiraRestClient;
    }

    /** GET /rest/api/3/field - tum sistem + custom alanlarin id/name/schema listesi. */
    @Cacheable("jira-fields")
    public List<Map<String, Object>> listFields() {
        return jiraRestClient.get()
                .uri("/rest/api/3/field")
                .retrieve()
                .body(List.class);
    }

    /** GET /rest/api/3/project/search - proje anahtarlari (orn. CI, PRJ). */
    @Cacheable("jira-projects")
    public Map<String, Object> listProjects() {
        return jiraRestClient.get()
                .uri("/rest/api/3/project/search?maxResults=100")
                .retrieve()
                .body(Map.class);
    }

    /** GET /rest/api/3/status - Excel Listeler sayfasindaki statulerle eslesme kontrolu icin. */
    @Cacheable("jira-statuses")
    public List<Map<String, Object>> listStatuses() {
        return jiraRestClient.get()
                .uri("/rest/api/3/status")
                .retrieve()
                .body(List.class);
    }

    /** GET /rest/api/3/priority - Excel Oncelik (Kritik/Yuksek/Orta/Dusuk) eslemesi icin. */
    @Cacheable("jira-priorities")
    public List<Map<String, Object>> listPriorities() {
        return jiraRestClient.get()
                .uri("/rest/api/3/priority")
                .retrieve()
                .body(List.class);
    }

    /** GET /rest/agile/1.0/board?projectKeyOrId={key} - takimin board id'si. */
    @Cacheable(value = "jira-boards", key = "#projectKey")
    public Map<String, Object> listBoards(String projectKey) {
        return jiraRestClient.get()
                .uri("/rest/agile/1.0/board?projectKeyOrId=" + projectKey)
                .retrieve()
                .body(Map.class);
    }

    /** GET /rest/agile/1.0/board/{boardId}/sprint?state=active - guncel (aktif) sprint. */
    @Cacheable(value = "jira-active-sprint", key = "#boardId")
    public Map<String, Object> getActiveSprint(Long boardId) {
        return jiraRestClient.get()
                .uri("/rest/agile/1.0/board/" + boardId + "/sprint?state=active")
                .retrieve()
                .body(Map.class);
    }

    /**
     * GET /rest/agile/1.0/board - proje filtresi olmadan, admin token'in gordugu
     * TUM board'lar (sayfali, startAt/isLast ile). Instance'daki her takim icin
     * board bulmak amaciyla kullanilir.
     */
    @SuppressWarnings("unchecked")
    @Cacheable("jira-boards-all")
    public List<Map<String, Object>> listAllBoards() {
        List<Map<String, Object>> all = new ArrayList<>();
        int startAt = 0;
        for (int page = 0; page < 20; page++) { // guvenlik siniri: 20 * 50 = 1000 board
            Map<String, Object> response = jiraRestClient.get()
                    .uri("/rest/agile/1.0/board?startAt=" + startAt + "&maxResults=50")
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                break;
            }
            List<Map<String, Object>> values = (List<Map<String, Object>>) response.getOrDefault("values", List.of());
            all.addAll(values);
            boolean isLast = Boolean.TRUE.equals(response.get("isLast")) || values.isEmpty();
            if (isLast) {
                break;
            }
            startAt += values.size();
        }
        return all;
    }

    /**
     * Instance'daki HER board icin aktif sprinti tek cagrida toplar - "tum
     * takimlarin guncel sprinti" genel goruntusu. type=kanban olan board'lar
     * atlanir (sprint kavrami yok); ama type=simple (takim-yonetimli/next-gen)
     * board'lar da scrum kadar sprint'e sahip olabilir (orn. IZ panosu), bu
     * yuzden sadece "kanban" haric HER tip denenir. Bir board'da sprint ozelligi
     * kapaliysa o board sessizce atlanir, tum liste bir board yuzunden basarisiz olmaz.
     */
    @SuppressWarnings("unchecked")
    @Cacheable("jira-active-sprints-all")
    public List<Map<String, Object>> listActiveSprintsAcrossAllTeams() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> board : listAllBoards()) {
            if ("kanban".equals(board.get("type"))) {
                continue;
            }
            Long boardId = ((Number) board.get("id")).longValue();
            try {
                Map<String, Object> sprintResponse = fetchActiveSprintWithRetry(boardId);
                List<Map<String, Object>> sprints = sprintResponse == null
                        ? List.of() : (List<Map<String, Object>>) sprintResponse.getOrDefault("values", List.of());
                for (Map<String, Object> sprint : sprints) {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("board", board);
                    entry.put("sprint", sprint);
                    result.add(entry);
                }
            } catch (RestClientException e) {
                // Board'da sprint ozelligi kapali olabilir (400/404) - beklenen durum, sessizce atla.
                // Diger hatalar (429/5xx) ise loglanir, boylece "neden bu takim eksik" gorulebilir.
                log.warn("Board icin aktif sprint alinamadi, atlaniyor. boardId={}, board={}, hata={}",
                        boardId, board.get("name"), e.getMessage());
            }
        }
        return result;
    }

    /**
     * getActiveSprint icin, Jira'nin rate-limit (429) yanitina karsi tek seferlik
     * kisa bekleme + tekrar deneme. listActiveSprintsAcrossAllTeams her cagrida
     * onlarca board icin ardisik istek atabildiginden 429 gormek olasi.
     */
    private Map<String, Object> fetchActiveSprintWithRetry(Long boardId) {
        try {
            return getActiveSprint(boardId);
        } catch (RestClientException first) {
            boolean rateLimited = first.getMessage() != null && first.getMessage().contains("429");
            if (!rateLimited) {
                throw first;
            }
            try {
                Thread.sleep(500);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw first;
            }
            return getActiveSprint(boardId);
        }
    }
}
