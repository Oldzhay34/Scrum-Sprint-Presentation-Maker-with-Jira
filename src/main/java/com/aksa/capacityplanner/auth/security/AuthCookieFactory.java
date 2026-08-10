package com.aksa.capacityplanner.auth.security;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Auth cookie'lerinin (access/refresh/CSRF) tutarli sekilde uretilmesini
 * saglar - AuthController'daki login/refresh/logout aksiyonlari tarafindan kullanilir.
 */
@Component
public class AuthCookieFactory {

    private final JwtProperties properties;

    public AuthCookieFactory(JwtProperties properties) {
        this.properties = properties;
    }

    public ResponseCookie accessTokenCookie(String token) {
        return baseBuilder(CookieNames.ACCESS_TOKEN, token, "/")
                .maxAge(properties.getAccessTokenTtlMinutes() * 60)
                .build();
    }

    public ResponseCookie refreshTokenCookie(String token) {
        return baseBuilder(CookieNames.REFRESH_TOKEN, token, "/api/auth")
                .maxAge(properties.getRefreshTokenTtlDays() * 24 * 60 * 60)
                .build();
    }

    /** Frontend'in okuyup X-CSRF-Token header'ina yansitmasi gereken, httpOnly OLMAYAN cookie. */
    public ResponseCookie csrfTokenCookie() {
        return ResponseCookie.from(CookieNames.XSRF_TOKEN, UUID.randomUUID().toString())
                .httpOnly(false)
                .secure(properties.isCookieSecure())
                .sameSite(properties.getSameSite())
                .path("/")
                .maxAge(properties.getRefreshTokenTtlDays() * 24 * 60 * 60)
                .build();
    }

    public ResponseCookie expiredAccessTokenCookie() {
        return baseBuilder(CookieNames.ACCESS_TOKEN, "", "/").maxAge(0).build();
    }

    public ResponseCookie expiredRefreshTokenCookie() {
        return baseBuilder(CookieNames.REFRESH_TOKEN, "", "/api/auth").maxAge(0).build();
    }

    public ResponseCookie expiredCsrfTokenCookie() {
        return ResponseCookie.from(CookieNames.XSRF_TOKEN, "")
                .httpOnly(false)
                .secure(properties.isCookieSecure())
                .sameSite(properties.getSameSite())
                .path("/")
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder baseBuilder(String name, String value, String path) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(properties.isCookieSecure())
                .sameSite(properties.getSameSite())
                .path(path);
    }
}
