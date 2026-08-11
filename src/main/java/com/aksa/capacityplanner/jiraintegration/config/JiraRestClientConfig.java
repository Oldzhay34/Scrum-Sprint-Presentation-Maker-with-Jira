package com.aksa.capacityplanner.jiraintegration.config;

import com.aksa.capacityplanner.jiraintegration.domain.JiraAccessDeniedException;
import com.aksa.capacityplanner.jiraintegration.domain.JiraReadOnlyViolationException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;

/**
 * jira.enabled=true oldugunda kurulan RestClient bean'i. JiraProperties'teki
 * base-url/account-email/api-key ile Basic Auth header'ini onceden hazirlar,
 * boylece JiraRestClientAdapter her cagride tekrar kimlik bilgisi kurmaz.
 *
 * Iki savunma katmani burada, TUM jiraRestClient cagrilari icin merkezi olarak
 * kurulur (tek tek adaptor/servis metotlarina degil, buraya eklenir - boylece
 * ileride eklenecek yeni bir Jira cagrisi da otomatik korunur):
 *
 *  1) requestInterceptor: Jira'da veri DEGISTIREBILECEK hicbir istek Jira'ya
 *     ULASMADAN engellenir (bkz. JiraReadOnlyViolationException). Bu "sadece
 *     GET" degil - Jira'nin kendi arama uc noktalari (search/jql,
 *     search/approximate-count, issue/bulkfetch, worklog/list) sorgu
 *     govdesini Body'de tasidigi icin BILEREK POST kullanir ama veri
 *     degistirmez, bu yuzden READ_ONLY_POST_PATH_SUFFIXES ile ayri tutulur.
 *     PUT/PATCH/DELETE ise Jira'da her zaman yazma/silme anlamina geldigi
 *     icin kosulsuz engellenir.
 *  2) defaultStatusHandler: Jira 403 (Forbidden) donerse (bkz.
 *     JiraAccessDeniedException) - baglanan API key su an admin yetkisiyle
 *     TUM projelere erisebiliyor olsa da, bu HER API key icin gecerli
 *     olmayabilir (orn. daha kisitli yetkili bir servis hesabi). 403,
 *     RestClientException'in genel/gecici hata tipinden (429/5xx) ayri
 *     yakalanabilsin diye kendi tipine cevrilir.
 */
@Configuration
@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "true")
public class JiraRestClientConfig {

    /**
     * Jira'nin govde-tasiyan (sorgu parametreleri POST body'sinde giden) ama
     * VERI DEGISTIRMEYEN arama/toplu-okuma uc noktalari - path bu son eklerden
     * biriyle bitiyorsa POST olsa da izinlidir.
     */
    private static final Set<String> READ_ONLY_POST_PATH_SUFFIXES = Set.of(
            "/search/jql",
            "/search",
            "/search/approximate-count",
            "/issue/bulkfetch",
            "/worklog/list");

    @Bean
    public RestClient jiraRestClient(JiraProperties jiraProperties) {
        String credentials = jiraProperties.getAccountEmail() + ":" + jiraProperties.getApiKey();
        String basicAuth = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        return RestClient.builder()
                .baseUrl(jiraProperties.getBaseUrl())
                .defaultHeader("Authorization", basicAuth)
                .defaultHeader("Accept", "application/json")
                .defaultHeader("Content-Type", "application/json")
                .requestInterceptor((request, body, execution) -> {
                    HttpMethod method = request.getMethod();
                    boolean mutating = method != HttpMethod.GET
                            && !(method == HttpMethod.POST && isReadOnlyPost(request.getURI().getPath()));
                    if (mutating) {
                        throw new JiraReadOnlyViolationException(method.name(), request.getURI().toString());
                    }
                    return execution.execute(request, body);
                })
                .defaultStatusHandler(
                        status -> status.value() == 403,
                        (request, response) -> {
                            throw JiraAccessDeniedException.forRequest(request.getMethod().name(), request.getURI().toString());
                        })
                .build();
    }

    private static boolean isReadOnlyPost(String path) {
        return READ_ONLY_POST_PATH_SUFFIXES.stream().anyMatch(path::endsWith);
    }
}
