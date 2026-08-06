package com.aksa.capacityplanner.auth.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /**
     * HMAC imza anahtari. En az 256 bit (32 karakter) olmali. Prod'da env
     * degiskeni (APP_JWT_SECRET) ile ezilir, burada sadece lokal gelistirme
     * icin varsayilan var.
     */
    private String secret = "dev-only-secret-change-me-please-32-bytes-min";
    private long accessTokenTtlMinutes = 15;
    private long refreshTokenTtlDays = 7;
    /** Cookie'lerde Secure bayragi - lokal http gelistirmede false, https prod'da true olmali. */
    private boolean cookieSecure = false;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessTokenTtlMinutes() {
        return accessTokenTtlMinutes;
    }

    public void setAccessTokenTtlMinutes(long accessTokenTtlMinutes) {
        this.accessTokenTtlMinutes = accessTokenTtlMinutes;
    }

    public long getRefreshTokenTtlDays() {
        return refreshTokenTtlDays;
    }

    public void setRefreshTokenTtlDays(long refreshTokenTtlDays) {
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    public boolean isCookieSecure() {
        return cookieSecure;
    }

    public void setCookieSecure(boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }
}
