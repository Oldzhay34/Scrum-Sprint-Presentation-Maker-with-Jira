package com.aksa.capacityplanner.common.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Caffeine(L1) + Redis(L2) destekli, adlandirilmis cache'leri lazy olarak
 * yaratan CacheManager. TTL her cache icin ayni (app.cache.ttl-seconds), hard TTL.
 */
public class TwoLevelCacheManager implements CacheManager {

    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration ttl;
    private final ConcurrentHashMap<String, Cache> caches = new ConcurrentHashMap<>();

    public TwoLevelCacheManager(RedisTemplate<String, Object> redisTemplate, Duration ttl) {
        this.redisTemplate = redisTemplate;
        this.ttl = ttl;
    }

    @Override
    public Cache getCache(String name) {
        return caches.computeIfAbsent(name, this::createCache);
    }

    @Override
    public Collection<String> getCacheNames() {
        return Collections.unmodifiableSet(caches.keySet());
    }

    private Cache createCache(String name) {
        com.github.benmanes.caffeine.cache.Cache<Object, Object> l1 = Caffeine.newBuilder()
                .expireAfterWrite(ttl)
                .maximumSize(10_000)
                .build();
        return new TwoLevelCache(name, l1, redisTemplate, ttl);
    }
}
