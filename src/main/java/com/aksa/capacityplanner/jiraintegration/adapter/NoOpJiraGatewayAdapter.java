package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Jira entegrasyonu henuz aktif degilken (jira.enabled=false, varsayilan) kullanilan stub adaptor.
 * Gercek Jira baglantisini devreye almak icin: JiraGatewayPort'u implemente eden yeni bir
 * @Component sinifi yaz (@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "true")
 * ile isaretle), .env'de JIRA_ENABLED=true + JIRA_BASE_URL + JIRA_ACCOUNT_EMAIL + JIRA_API_KEY degerlerini gir.
 * Bu sinif otomatik olarak devre disi kalir, baska hicbir kod degisikligi gerekmez.
 */
@Component
@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoOpJiraGatewayAdapter implements JiraGatewayPort {

    @Override
    public List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query) {
        return List.of();
    }
}
