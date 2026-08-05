package com.aksa.capacityplanner.auth.application.port.out;

import com.aksa.capacityplanner.auth.domain.model.Personnel;

public interface TokenGeneratePort {

    GeneratedToken generate(Personnel personnel);

    record GeneratedToken(
            String accessToken,
            long expiresIn
    ) {
    }
}