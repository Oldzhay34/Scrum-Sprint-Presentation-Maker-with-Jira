package com.aksa.capacityplanner.auth.api.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String sicil, @NotBlank String password) {
}
