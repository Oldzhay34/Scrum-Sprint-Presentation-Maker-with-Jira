package com.aksa.capacityplanner.auth.domain.model;

import java.util.List;

public record Personnel(
        Long id,
        String username,
        String password,
        String company,
        String department,
        String title,
        String extensionAttribute4,
        String extensionAttribute6,
        String extensionAttribute8,
        List<String> roles,
        boolean active
) {
}