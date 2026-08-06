package com.aksa.capacityplanner.auth.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/**
 * Refresh token'lari (opak random string -> sicil) sunucu tarafinda tutar.
 * DB henuz baglanmadigi icin kalici bir tabloya degil, Caffeine cache'e
 * yazilir - uygulama yeniden baslatildiginda tum refresh token'lar gecersiz
 * olur (kabul edilebilir, DB baglaninca kalici bir store ile degistirilecek).
 * Acil hesap kitleme: revoke() ile token aninda cache'ten silinir.
 */
@Component
public class RefreshTokenStore {

    private final Cache<String, String> tokenToSicil;

    public RefreshTokenStore(JwtProperties properties) {
        this.tokenToSicil = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofDays(properties.getRefreshTokenTtlDays()))
                .build();
    }

    public String issue(String sicil) {
        String token = UUID.randomUUID().toString();
        tokenToSicil.put(token, sicil);
        return token;
    }

    public Optional<String> sicilFor(String refreshToken) {
        return Optional.ofNullable(tokenToSicil.getIfPresent(refreshToken));
    }

    public void revoke(String refreshToken) {
        tokenToSicil.invalidate(refreshToken);
    }
}
