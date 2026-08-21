package com.aksa.capacityplanner.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cache")
public class CacheProperties {

    /** Caffeine cache icin hard TTL (bkz. JvmCacheManager) - erisimle uzamaz. */
    private long ttlSeconds = 300;

    public long getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(long ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
}
