package com.aksa.capacityplanner.auth.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank
        String username,

        @NotBlank
        String password,

        String company,
        String department,
        String title,
        String extensionAttribute4,
        String extensionAttribute6,
        String extensionAttribute8
) {
}