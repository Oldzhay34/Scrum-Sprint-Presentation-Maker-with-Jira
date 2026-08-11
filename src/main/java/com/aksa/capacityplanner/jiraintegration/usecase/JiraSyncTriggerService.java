package com.aksa.capacityplanner.jiraintegration.usecase;

import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncRateLimiter;
import com.aksa.capacityplanner.jiraintegration.config.JiraSyncQueueConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Jira senkronizasyon istegini kuyruga dusuren giris noktasi.
 * Gercek isleme JiraSyncRequestConsumer icinde, arka planda gerceklesir.
 *
 * Kuyruga dusurmeden ONCE JiraSyncRateLimiter kontrol edilir - ayni takim
 * icin cooldown suresi dolmadan gelen istekler Jira'ya/RabbitMQ'ya hic
 * ulasmadan JiraSyncRateLimitedException ile reddedilir (bkz. GlobalExceptionHandler,
 * HTTP 429).
 */
@Service
public class JiraSyncTriggerService {

    private final RabbitTemplate rabbitTemplate;
    private final JiraSyncRateLimiter rateLimiter;

    public JiraSyncTriggerService(RabbitTemplate rabbitTemplate, JiraSyncRateLimiter rateLimiter) {
        this.rabbitTemplate = rabbitTemplate;
        this.rateLimiter = rateLimiter;
    }

    public void requestSync(Long teamId, String jiraProjectKey, String jql) {
        rateLimiter.checkAndRecord(teamId);
        JiraSyncRequestedMessage message = new JiraSyncRequestedMessage(teamId, jiraProjectKey, jql);
        rabbitTemplate.convertAndSend(JiraSyncQueueConfig.EXCHANGE, JiraSyncQueueConfig.REQUEST_ROUTING_KEY, message);
    }
}
