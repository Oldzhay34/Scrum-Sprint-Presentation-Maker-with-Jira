package com.aksa.capacityplanner.auth.security;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Access token'in (JWT) imzalanmasi/dogrulanmasi. Rol ve takim bilgisi
 * claim olarak gomulur ki her istekte DB'ye gitmeden yetkilendirme yapilabilsin
 * (stateless). Refresh token bu sinifin disinda, opak bir string olarak
 * AuthService tarafindan yonetilir.
 */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TEAM_ID = "teamId";
    private static final String CLAIM_FULL_NAME = "fullName";
    private static final String CLAIM_DEPARTMENT = "department";

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtTokenProvider(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(AuthUser user) {
        Instant now = Instant.now();
        var builder = Jwts.builder()
                .subject(user.getSicil())
                .claim(CLAIM_ROLE, user.getRole().name())
                .claim(CLAIM_FULL_NAME, user.getFullName())
                .claim(CLAIM_DEPARTMENT, user.getDepartment())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(properties.getAccessTokenTtlMinutes() * 60)));
        if (user.getTeamId() != null) {
            builder.claim(CLAIM_TEAM_ID, user.getTeamId());
        }
        return builder.signWith(key).compact();
    }

    public long accessTokenTtlSeconds() {
        return properties.getAccessTokenTtlMinutes() * 60;
    }

    public Optional<AccessTokenClaims> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String sicil = claims.getSubject();
            Role role = Role.valueOf(claims.get(CLAIM_ROLE, String.class));
            String fullName = claims.get(CLAIM_FULL_NAME, String.class);
            String department = claims.get(CLAIM_DEPARTMENT, String.class);
            Number teamIdNumber = claims.get(CLAIM_TEAM_ID, Number.class);
            Long teamId = teamIdNumber != null ? teamIdNumber.longValue() : null;
            return Optional.of(new AccessTokenClaims(sicil, fullName, role, teamId, department));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record AccessTokenClaims(String sicil, String fullName, Role role, Long teamId, String department) {
    }
}
