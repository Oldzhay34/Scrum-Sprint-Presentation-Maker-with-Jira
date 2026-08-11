package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.jiraintegration.config.JiraProperties;
import com.aksa.capacityplanner.jiraintegration.domain.JiraSyncRateLimitedException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Redis'te atomik "SET IF NOT EXISTS + TTL" ile takim basina sabit-pencere
 * (fixed-window) rate limit uygular. jira.enabled degerinden BAGIMSIZ her
 * zaman aktiftir - NoOp adaptor devredeyken de bos donse dahi ayni takim icin
 * RabbitMQ'ya art arda mesaj yigilmasini engeller.
 *
 * Neden Redis (uygulama-ici bir Map/Guava RateLimiter degil): backend birden
 * fazla replikayla calisabilir (Railway/prod) - limit tek bir JVM'e degil,
 * TUM instance'lar arasinda PAYLASILAN bir sayaca dayanmali. TwoLevelCache'in
 * kullandigi ayni RedisTemplate bean'i (bkz. CacheConfig) burada da kullanilir,
 * ama bu bir "cache" degil - TTL'i dolana kadar KESINLIKLE silinmeyen bir kilit
 * (jira-issues cache'inde yasanan ClassCastException nedeniyle - bkz.
 * JiraRestClientAdapter javadoc'u - burada deger olarak sadece "1" string'i
 * tutulur, karmasik/generic bir tip DEGIL, boylece ayni serialization sorunu
 * tekrar yasanmaz).
 */
@Component
public class JiraSyncRateLimiter {

    private static final String KEY_PREFIX = "jira-sync-cooldown::";

    private final RedisTemplate<String, Object> redisTemplate;
    private final JiraProperties jiraProperties;

    public JiraSyncRateLimiter(RedisTemplate<String, Object> redisTemplate, JiraProperties jiraProperties) {
        this.redisTemplate = redisTemplate;
        this.jiraProperties = jiraProperties;
    }

    /**
     * teamId icin izin verilirse sessizce doner; cooldown suresi dolmadiysa
     * JiraSyncRateLimitedException firlatir (kalan saniye ile).
     */
    public void checkAndRecord(Long teamId) {
        String key = KEY_PREFIX + teamId;
        Duration cooldown = Duration.ofSeconds(jiraProperties.getSyncCooldownSeconds());

        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(key, "1", cooldown);
        if (Boolean.TRUE.equals(acquired)) {
            return;
        }

        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        long retryAfter = (ttl != null && ttl > 0) ? ttl : jiraProperties.getSyncCooldownSeconds();
        throw new JiraSyncRateLimitedException(retryAfter);
    }
}
