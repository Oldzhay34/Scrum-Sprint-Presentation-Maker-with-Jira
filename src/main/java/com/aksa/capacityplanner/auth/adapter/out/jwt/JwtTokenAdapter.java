package com.aksa.capacityplanner.auth.adapter.out.jwt;

import com.aksa.capacityplanner.auth.application.port.out.TokenGeneratePort;
import com.aksa.capacityplanner.auth.domain.model.Personnel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class JwtTokenAdapter implements TokenGeneratePort {

    private static final Duration TOKEN_DURATION = Duration.ofHours(1);

    private final JwtEncoder jwtEncoder;

    @Override
    public GeneratedToken generate(Personnel personnel) {

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(TOKEN_DURATION);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("capacity-planner")
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(personnel.username())

                .claim("company", trim(personnel.company()))
                .claim("department", trim(personnel.department()))
                .claim("title", trim(personnel.title()))
                .claim(
                        "ExtensionAttribute4",
                        trim(personnel.extensionAttribute4())
                )
                .claim(
                        "ExtensionAttribute6",
                        trim(personnel.extensionAttribute6())
                )
                .claim(
                        "ExtensionAttribute8",
                        trim(personnel.extensionAttribute8())
                )
                .claim("roles", personnel.roles())
                .build();

        JwsHeader header = JwsHeader
                .with(SignatureAlgorithm.RS256)
                .type("JWT")
                .build();

        Jwt jwt = jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        );

        return new GeneratedToken(
                jwt.getTokenValue(),
                TOKEN_DURATION.toSeconds()
        );
    }

    private String trim(String value) {
        return Objects.requireNonNullElse(value, "").trim();
    }
}