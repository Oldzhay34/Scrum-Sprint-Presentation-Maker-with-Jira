package com.aksa.capacityplanner.jiraintegration.port;

import java.util.List;

/**
 * Jira REST API'sinden is kalemlerini cekmek icin cikis portu.
 * Su an icin gercek bir Jira baglantisi yok; NoOpJiraGatewayAdapter bos liste doner.
 * Ileride bu port'u implemente eden gercek bir JiraRestClientAdapter eklenerek
 * (jira alanlarinin proje/takima gore degisebilmesi nedeniyle) esnek bir
 * field-mapping katmani ile capacity.WorkItem'a donusum yapilacak.
 */
public interface JiraGatewayPort {

    List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query);

    record JiraFetchQuery(String jiraProjectKey, String jql) {
    }

    /**
     * Jira'dan donen ham alanlarin genel amacli tasiyicisi. Takima gore degisen
     * custom field'lar fieldValues icinde jira field id -> deger olarak tutulur;
     * WorkItem'a donusum usecase katmaninda takima ozgu mapping ile yapilir.
     */
    record JiraIssueSnapshot(String issueKey, String summary, String statusName,
                              java.util.Map<String, Object> fieldValues) {
    }
}
