package com.aksa.capacityplanner.common.config;

import com.aksa.capacityplanner.common.cache.JvmCacheManager;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * JVM-ici (Caffeine) cache altyapisi. TTL app.cache.ttl-seconds ile kontrol
 * edilir (varsayilan 300sn = 5dk), hard TTL.
 *
 * Eskiden burada bir RedisTemplate bean'i ve Caffeine+Redis iki katmanli bir
 * CacheManager vardi; Redis kaldirildi (bkz. JvmCacheManager javadoc'u).
 * @Cacheable/@CacheEvict kullanan servislerin HICBIRI degismedi - onlar zaten
 * yalnizca Spring'in Cache soyutlamasini goruyor.
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(CacheProperties.class)
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(CacheProperties cacheProperties) {
        return new JvmCacheManager(Duration.ofSeconds(cacheProperties.getTtlSeconds()));
    }
}
