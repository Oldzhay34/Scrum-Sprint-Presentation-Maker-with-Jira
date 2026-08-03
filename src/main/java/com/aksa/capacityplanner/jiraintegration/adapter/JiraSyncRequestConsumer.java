package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.config.JiraSyncQueueConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraIssueSnapshot;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * jira.sync.request.queue tuketicisi. JiraGatewayPort uzerinden issue'lari ceker
 * ve WorkItem olarak upsert eder. Jira baglantisi devrede degilken (NoOpJiraGatewayAdapter)
 * bos liste doner, bu durumda hicbir sey yapmadan biter - akis yine de uctan uca calisir.
 *
 * Gercek Jira alan eslemesi (fieldValues -> WorkItem) takima gore degisebilecegi icin
 * burada sadece ozet/durum gibi genel alanlar kullanilir; takima ozgu mapping ileride
 * bu sinifa veya ayri bir JiraFieldMapper'a eklenebilir.
 */
@Component
public class JiraSyncRequestConsumer {

    private static final Logger log = LoggerFactory.getLogger(JiraSyncRequestConsumer.class);

    private final JiraGatewayPort jiraGatewayPort;
    private final WorkItemRepositoryPort workItemRepository;

    public JiraSyncRequestConsumer(JiraGatewayPort jiraGatewayPort, WorkItemRepositoryPort workItemRepository) {
        this.jiraGatewayPort = jiraGatewayPort;
        this.workItemRepository = workItemRepository;
    }

    @RabbitListener(queues = JiraSyncQueueConfig.REQUEST_QUEUE)
    public void onSyncRequested(JiraSyncRequestedMessage message) {
        log.info("Jira sync istegi alindi: teamId={}, project={}", message.teamId(), message.jiraProjectKey());

        var issues = jiraGatewayPort.fetchIssues(
                new JiraGatewayPort.JiraFetchQuery(message.jiraProjectKey(), message.jql()));

        if (issues.isEmpty()) {
            log.info("Jira'dan donen issue yok (jira.enabled=false veya sonuc bos). teamId={}", message.teamId());
            return;
        }

        for (JiraIssueSnapshot issue : issues) {
            upsert(message.teamId(), issue);
        }
    }

    private void upsert(Long teamId, JiraIssueSnapshot issue) {
        WorkItem workItem = workItemRepository.findByJiraIssueKey(issue.issueKey())
                .orElseGet(() -> new WorkItem(null, teamId, null, issue.summary(), issue.issueKey(),
                        BigDecimal.ZERO, issue.statusName(), WorkItemSource.JIRA, LocalDate.now(), null));
        workItem.setTitle(issue.summary());
        workItem.setStatusCode(issue.statusName());
        workItemRepository.save(workItem);
    }
}
