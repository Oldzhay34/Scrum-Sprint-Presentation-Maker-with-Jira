package com.aksa.capacityplanner.auth.adapter.in.web.dto;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}