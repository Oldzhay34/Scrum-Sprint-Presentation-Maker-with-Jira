package com.aksa.capacityplanner.jiraintegration.usecase;

import com.aksa.capacityplanner.jiraintegration.config.JiraSyncQueueConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Jira senkronizasyon istegini kuyruga dusuren giris noktasi.
 * Gercek isleme JiraSyncRequestConsumer icinde, arka planda gerceklesir.
 */
@Service
public class JiraSyncTriggerService {

    private final RabbitTemplate rabbitTemplate;

    public JiraSyncTriggerService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void requestSync(Long teamId, String jiraProjectKey, String jql) {
        JiraSyncRequestedMessage message = new JiraSyncRequestedMessage(teamId, jiraProjectKey, jql);
        rabbitTemplate.convertAndSend(JiraSyncQueueConfig.EXCHANGE, JiraSyncQueueConfig.REQUEST_ROUTING_KEY, message);
    }
}
