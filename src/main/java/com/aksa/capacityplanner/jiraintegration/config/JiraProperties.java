package com.aksa.capacityplanner.jiraintegration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Jira baglantisini kontrol eden ayarlar (.env / application.yml: JIRA_*).
 *
 * Gercek Jira entegrasyonunu devreye almak icin tek yapilmasi gereken:
 *   1) JiraGatewayPort'u implemente eden yeni bir @Component sinifi yaz
 *      (orn. JiraRestClientAdapter), @ConditionalOnProperty(prefix = "jira",
 *      name = "enabled", havingValue = "true") ile isaretle ve bu properties'i kullan.
 *   2) .env dosyasinda JIRA_ENABLED=true, JIRA_BASE_URL, JIRA_ACCOUNT_EMAIL, JIRA_API_KEY degerlerini gir.
 * NoOpJiraGatewayAdapter, jira.enabled=false (varsayilan) oldugu surece otomatik devrede kalir;
 * enabled=true olunca kendini devre disi birakir.
 */
@ConfigurationProperties(prefix = "jira")
public class JiraProperties {

    private boolean enabled = false;
    private String baseUrl;
    private String accountEmail;
    private String apiKey;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getAccountEmail() {
        return accountEmail;
    }

    public void setAccountEmail(String accountEmail) {
        this.accountEmail = accountEmail;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
}
