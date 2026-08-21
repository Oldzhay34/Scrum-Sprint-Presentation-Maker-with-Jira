package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.jiraintegration.config.JiraProperties;
import com.aksa.capacityplanner.jiraintegration.domain.JiraSyncRateLimitedException;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Takim basina sabit-pencere (fixed-window) rate limit. jira.enabled
 * degerinden BAGIMSIZ her zaman aktiftir - NoOp adaptor devredeyken de bos
 * donse dahi ayni takim icin arka arkaya sync isi yigilmasini engeller.
 *
 * ONCEDEN Redis'te atomik "SET IF NOT EXISTS + TTL" ile tutuluyordu; Redis
 * kaldirildi (bkz. JvmCacheManager javadoc'u). Ayni atomiklik burada
 * ConcurrentHashMap.compute ile saglaniyor - tek bir kilit altinda "suresi
 * dolmus mu?" kontrolu ve yeni pencerenin yazilmasi birlikte yapilir, iki
 * es zamanli istek ayni anda gecemez.
 *
 * KISIT: sayac artik TEK JVM'e ait. Backend birden fazla replika ile
 * calisirsa her replika kendi cooldown'unu tutar ve limit delinir - bu
 * yuzden backend TEK REPLIKA calismak zorunda (ayni kisit cache icin de
 * gecerli). Yeniden baslatmada cooldown sifirlanir; bu zararsizdir, en
 * kotu ihtimalle kullanici bir sync'i erken tekrar tetikleyebilir.
 */
@Component
public class JiraSyncRateLimiter {

    /** teamId -> pencerenin bittigi an (System.nanoTime tabanli, saat degisiminden etkilenmez). */
    private final Map<Long, Long> windowEndNanosByTeamId = new ConcurrentHashMap<>();

    private final JiraProperties jiraProperties;

    public JiraSyncRateLimiter(JiraProperties jiraProperties) {
        this.jiraProperties = jiraProperties;
    }

    /**
     * teamId icin izin verilirse sessizce doner; cooldown suresi dolmadiysa
     * JiraSyncRateLimitedException firlatir (kalan saniye ile).
     */
    public void checkAndRecord(Long teamId) {
        long cooldownSeconds = jiraProperties.getSyncCooldownSeconds();
        long now = System.nanoTime();
        long cooldownNanos = cooldownSeconds * 1_000_000_000L;

        Long windowEnd = windowEndNanosByTeamId.compute(teamId, (id, existingEnd) -> {
            if (existingEnd != null && existingEnd - now > 0) {
                return existingEnd; // pencere hala acik - dokunma, asagida reddedilecek
            }
            return now + cooldownNanos; // pencere yok/dolmus - yenisini baslat
        });

        long remainingNanos = windowEnd - now;
        boolean acquired = remainingNanos == cooldownNanos;
        if (acquired) {
            return;
        }

        // Redis'in getExpire'i saniyeye YUVARLIYORDU; ayni kullanici deneyimi
        // icin kalan sure yukari yuvarlanir (0 saniye "hemen tekrar dene"
        // izlenimi vermesin).
        long retryAfter = Math.max(1L, (remainingNanos + 999_999_999L) / 1_000_000_000L);
        throw new JiraSyncRateLimitedException(retryAfter);
    }
}
