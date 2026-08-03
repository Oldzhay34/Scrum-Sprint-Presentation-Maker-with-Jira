package com.aksa.capacityplanner.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.cache")
public class CacheProperties {

    /** Hem L1 (Caffeine) hem L2 (Redis) icin hard TTL - erisimle uzamaz. */
    private long ttlSeconds = 300;

    public long getTtlSeconds() {
        return ttlSeconds;
    }

    public void setTtlSeconds(long ttlSeconds) {
        this.ttlSeconds = ttlSeconds;
    }
}
