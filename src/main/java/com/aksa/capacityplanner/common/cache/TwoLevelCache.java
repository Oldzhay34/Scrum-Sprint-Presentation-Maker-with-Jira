package com.aksa.capacityplanner.common.cache;

import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.cache.support.SimpleValueWrapper;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.concurrent.Callable;

/**
 * Iki katmanli cache: once Caffeine (L1, JVM-ici, cok hizli), sonra Redis (L2, dagitik).
 * TTL her iki katmanda da "hard" (yazildigi andan itibaren sabit) - erisimle uzamaz.
 *
 * Okuma sirasi: L1 -> L2 (bulunursa L1'e geri yazilir) -> kaynak (caller/@Cacheable).
 * Yazma: hem L1 hem L2'ye ayni anda, ayni TTL ile yazilir.
 */
public class TwoLevelCache implements org.springframework.cache.Cache {

    private final String name;
    private final Cache<Object, Object> l1;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Duration ttl;

    public TwoLevelCache(String name, Cache<Object, Object> l1, RedisTemplate<String, Object> redisTemplate, Duration ttl) {
        this.name = name;
        this.l1 = l1;
        this.redisTemplate = redisTemplate;
        this.ttl = ttl;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public Object getNativeCache() {
        return l1;
    }

    @Override
    public ValueWrapper get(Object key) {
        Object value = l1.getIfPresent(key);
        if (value != null) {
            return new SimpleValueWrapper(value);
        }
        Object redisValue = redisTemplate.opsForValue().get(redisKey(key));
        if (redisValue != null) {
            l1.put(key, redisValue);
            return new SimpleValueWrapper(redisValue);
        }
        return null;
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T get(Object key, Callable<T> valueLoader) {
        ValueWrapper wrapper = get(key);
        if (wrapper != null) {
            return (T) wrapper.get();
        }
        try {
            T value = valueLoader.call();
            put(key, value);
            return value;
        } catch (Exception e) {
            throw new ValueRetrievalException(key, valueLoader, e);
        }
    }

    @Override
    public <T> T get(Object key, Class<T> type) {
        ValueWrapper wrapper = get(key);
        return wrapper == null ? null : type.cast(wrapper.get());
    }

    @Override
    public void put(Object key, Object value) {
        if (value == null) {
            evict(key);
            return;
        }
        l1.put(key, value);
        redisTemplate.opsForValue().set(redisKey(key), value, ttl);
    }

    @Override
    public void evict(Object key) {
        l1.invalidate(key);
        redisTemplate.delete(redisKey(key));
    }

    @Override
    public void clear() {
        l1.invalidateAll();
        var keys = redisTemplate.keys(name + "::*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    private String redisKey(Object key) {
        return name + "::" + key;
    }

    private Object unwrapNull(Object value) {
        return value == NullValue.INSTANCE ? null : value;
    }

    /** Redis'te null degeri temsil edebilmek icin isaretleyici. */
    private enum NullValue {
        INSTANCE
    }
}
