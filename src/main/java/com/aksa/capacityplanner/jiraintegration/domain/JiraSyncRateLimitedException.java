package com.aksa.capacityplanner.jiraintegration.domain;

/**
 * Ayni takim icin, bir onceki jira-sync tetiklemesinden bu yana yeterli sure
 * gecmeden yeni bir istek atildiginda firlatilir (bkz. JiraSyncRateLimiter).
 *
 * Bu korumanin gercek bir olay sonrasi eklendigini belirtmek gerekir: "Jira'dan
 * Çek" butonuna art arda tiklamak, her tikta 2000+ issue'luk bir Jira taramasi
 * baslatiyor ve RabbitMQ kuyruguna ayni takim icin ust uste mesaj birikiyordu -
 * hem Jira'ya (rate limit riski), hem veritabanina (tekrarlanan upsert), hem de
 * RabbitMQ/consumer'a gereksiz yuk biniyordu. Rate limiter bu istekleri Jira'ya
 * hic ulasmadan, kuyruga bile dusmeden reddeder.
 */
public class JiraSyncRateLimitedException extends RuntimeException {

    private final long retryAfterSeconds;

    public JiraSyncRateLimitedException(long retryAfterSeconds) {
        super("Bu takım için Jira senkronizasyonu az önce tetiklendi - " + retryAfterSeconds
                + " saniye sonra tekrar deneyin.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
