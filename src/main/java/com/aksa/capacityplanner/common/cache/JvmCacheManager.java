package com.aksa.capacityplanner.common.cache;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;

import java.time.Duration;
import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sadece JVM-ici (Caffeine) adlandirilmis cache'leri lazy olarak yaratan
 * CacheManager. TTL her cache icin ayni (app.cache.ttl-seconds), hard TTL -
 * erisimle uzamaz.
 *
 * ONCEDEN Caffeine(L1) + Redis(L2) iki katmanliydi (TwoLevelCacheManager).
 * Redis KALDIRILDI: sirkette bu altyapiyi isletecek/izleyecek kimse yok
 * (kullanici bildirimi, 2026-08-21). Davranis birebir korundu - TTL, maksimum
 * boyut ve "null degerler cache'lenmez" kurali eskisiyle ayni.
 *
 * ONEMLI KISIT: cache artik instance'lar arasi PAYLASILMIYOR. Backend TEK
 * REPLIKA calismak zorunda - ikinci bir replika kalkarsa bir instance'in
 * @CacheEvict'i digerinin bayat verisini temizleyemez (orn. Jira sync sonrasi
 * eski kapasite sayilarinin gorunmesi - bkz. JiraSyncProcessor javadoc'u).
 */
public class JvmCacheManager implements CacheManager {

    private static final long MAX_ENTRIES_PER_CACHE = 10_000;

    private final Duration ttl;
    private final ConcurrentHashMap<String, Cache> caches = new ConcurrentHashMap<>();

    public JvmCacheManager(Duration ttl) {
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
        com.github.benmanes.caffeine.cache.Cache<Object, Object> native_ = Caffeine.newBuilder()
                .expireAfterWrite(ttl)
                .maximumSize(MAX_ENTRIES_PER_CACHE)
                .build();
        return new NullSkippingCaffeineCache(name, native_);
    }

    /**
     * Spring'in hazir CaffeineCache'i, allowNullValues=true iken null sonucu
     * NullValue olarak TTL boyunca saklar. Kaldirilan TwoLevelCache ise null
     * degeri HIC yazmaz, varsa kaydi siler - orn. Jira'nin bos govde donduru
     * bir cagri (JiraDiscoveryService.getActiveSprint) 5 dakika boyunca "sonuc
     * yok" diye cakili kalmazdi. O davranisi aynen korumak icin put() ezildi.
     */
    private static final class NullSkippingCaffeineCache extends CaffeineCache {

        private NullSkippingCaffeineCache(String name, com.github.benmanes.caffeine.cache.Cache<Object, Object> cache) {
            super(name, cache, true);
        }

        @Override
        public void put(Object key, Object value) {
            if (value == null) {
                evict(key);
                return;
            }
            super.put(key, value);
        }
    }
}
