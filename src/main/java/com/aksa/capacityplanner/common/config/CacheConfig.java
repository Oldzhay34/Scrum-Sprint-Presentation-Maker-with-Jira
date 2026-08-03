package com.aksa.capacityplanner.common.config;

import com.aksa.capacityplanner.common.cache.TwoLevelCacheManager;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Iki katmanli (Caffeine L1 + Redis L2) cache altyapisi.
 * TTL app.cache.ttl-seconds ile kontrol edilir (varsayilan 300sn = 5dk), hard TTL.
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(CacheProperties.class)
public class CacheConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        // Polimorfik tip bilgisini (@class) JSON'a gomen kendi default-typing'li mapper'ini kurar;
        // uygulamanin web katmanindaki paylasilan ObjectMapper'i ile kariştirilmaz.
        GenericJacksonJsonRedisSerializer valueSerializer =
                new GenericJacksonJsonRedisSerializer(tools.jackson.databind.json.JsonMapper.builder().build());

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(valueSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(valueSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisTemplate<String, Object> redisTemplate, CacheProperties cacheProperties) {
        return new TwoLevelCacheManager(redisTemplate, Duration.ofSeconds(cacheProperties.getTtlSeconds()));
    }
}
