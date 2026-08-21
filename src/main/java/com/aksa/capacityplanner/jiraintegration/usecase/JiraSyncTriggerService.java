package com.aksa.capacityplanner.jiraintegration.usecase;

import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncProcessor;
import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncRateLimiter;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import org.springframework.stereotype.Service;

/**
 * Jira senkronizasyon istegini arka plana devreden giris noktasi.
 * Gercek isleme JiraSyncProcessor icinde, ayri bir is parcaciginda gerceklesir -
 * bu metot hemen doner, HTTP istek dongusu beklemez (controller 202 Accepted).
 *
 * Devretmeden ONCE JiraSyncRateLimiter kontrol edilir - ayni takim icin
 * cooldown suresi dolmadan gelen istekler Jira'ya hic ulasmadan, arka plana
 * bile alinmadan JiraSyncRateLimitedException ile reddedilir (bkz.
 * GlobalExceptionHandler, HTTP 429).
 *
 * Eskiden bu sinif istegi RabbitMQ'ya (jira.sync.exchange) dusuruyordu;
 * kuyruk kaldirildi, gerekcesi ve takaslari icin bkz. JiraSyncAsyncConfig.
 */
@Service
public class JiraSyncTriggerService {

    private final JiraSyncProcessor jiraSyncProcessor;
    private final JiraSyncRateLimiter rateLimiter;

    public JiraSyncTriggerService(JiraSyncProcessor jiraSyncProcessor, JiraSyncRateLimiter rateLimiter) {
        this.jiraSyncProcessor = jiraSyncProcessor;
        this.rateLimiter = rateLimiter;
    }

    public void requestSync(Long teamId, String jiraProjectKey, String jql) {
        rateLimiter.checkAndRecord(teamId);
        JiraSyncRequestedMessage message = new JiraSyncRequestedMessage(teamId, jiraProjectKey, jql);
        // AYRI bir bean uzerinden cagriliyor - @Async proxy'si ancak boyle
        // devreye girer (ayni sinif icinden self-invocation calismazdi).
        jiraSyncProcessor.onSyncRequested(message);
    }
}
