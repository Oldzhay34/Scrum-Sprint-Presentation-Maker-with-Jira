package com.aksa.capacityplanner.unit.common;

import com.aksa.capacityplanner.common.cache.JvmCacheManager;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cache Caffeine(L1)+Redis(L2) ikilisinden tek katmanli JVM-ici Caffeine'e
 * indirildi - bu testler @Cacheable/@CacheEvict kullanan servislerin gordugu
 * davranisin degismedigini dogrular (put/get, evict, clear ve null degerlerin
 * cache'lenmemesi).
 */
class JvmCacheManagerTest {

    private final JvmCacheManager cacheManager = new JvmCacheManager(Duration.ofMinutes(5));

    @Test
    void ayniIsimIcinAyniCacheOrnegiDoner() {
        assertThat(cacheManager.getCache("team-members")).isSameAs(cacheManager.getCache("team-members"));
    }

    @Test
    void yazilanDegerGeriOkunur() {
        Cache cache = cacheManager.getCache("capacity-dashboard");
        cache.put("k", "v");

        assertThat(cache.get("k")).isNotNull();
        assertThat(cache.get("k", String.class)).isEqualTo("v");
    }

    @Test
    void evictSadeceIlgiliAnahtariSiler() {
        Cache cache = cacheManager.getCache("team-members-by-team");
        cache.put(1L, "bir");
        cache.put(2L, "iki");

        cache.evict(1L);

        assertThat(cache.get(1L)).isNull();
        assertThat(cache.get(2L, String.class)).isEqualTo("iki");
    }

    @Test
    void clearTumAnahtarlariSiler() {
        Cache cache = cacheManager.getCache("jira-boards");
        cache.put("RPA", "board-1");
        cache.put("IZ", "board-2");

        cache.clear();

        assertThat(cache.get("RPA")).isNull();
        assertThat(cache.get("IZ")).isNull();
    }

    @Test
    void nullDegerCachelenmez_varsaKaydiSiler() {
        // Kaldirilan TwoLevelCache'in davranisi: null yazmak = evict. Aksi halde
        // orn. Jira'nin bos govde donduru bir cagri TTL boyunca "sonuc yok" diye
        // cakili kalirdi (bkz. JvmCacheManager javadoc'u).
        Cache cache = cacheManager.getCache("jira-active-sprint");
        cache.put(7L, "sprint-13");

        cache.put(7L, null);

        assertThat(cache.get(7L)).isNull();
    }

    @Test
    void valueLoaderSonucuCachelenir() {
        Cache cache = cacheManager.getCache("jira-fields");

        assertThat(cache.get("x", () -> "hesaplandi")).isEqualTo("hesaplandi");
        assertThat(cache.get("x", () -> "tekrar-hesaplandi")).isEqualTo("hesaplandi");
    }

    @Test
    void getCacheNamesOlusturulanCachelerListeler() {
        JvmCacheManager manager = new JvmCacheManager(Duration.ofMinutes(1));
        manager.getCache("a");
        manager.getCache("b");

        assertThat(manager.getCacheNames()).containsExactlyInAnyOrder("a", "b");
    }
}
