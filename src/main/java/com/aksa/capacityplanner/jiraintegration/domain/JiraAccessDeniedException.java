package com.aksa.capacityplanner.jiraintegration.domain;

/**
 * Jira REST API'si 403 (Forbidden) dondurdugunde firlatilir.
 *
 * Baglanan API key genelde admin yetkisiyle TUM projelere/board'lara
 * erisebiliyor olsa da, bu her zaman boyle olmayabilir - daha kisitli
 * yetkili bir key (orn. sadece belirli projelere erisimi olan bir servis
 * hesabi) ile calisirken, token'in gormedigi bir takim/proje/board icin
 * istek atildiginda Jira 403 doner. Bu durum genel bir RestClientException
 * yerine kendi tipiyle yakalanabilsin diye ayri bir exception olarak
 * modellenir - cagiran taraf (orn. JiraSyncProcessor) bunu "gecici
 * hata, tekrar dene" durumundan (5xx/429) ayirt edip farkli ele alabilir
 * (orn. tekrar denemeden direkt kullaniciya "bu takim icin yetkiniz yok"
 * mesaji gosterebilir).
 */
public class JiraAccessDeniedException extends RuntimeException {

    public JiraAccessDeniedException(String message) {
        super(message);
    }

    public static JiraAccessDeniedException forRequest(String method, String uri) {
        return new JiraAccessDeniedException(
                "Jira API bu istegi reddetti (403 Forbidden): " + method + " " + uri
                        + " - baglanan API key'in bu takima/projeye erisim yetkisi olmayabilir.");
    }
}
