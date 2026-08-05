package com.aksa.capacityplanner.auth.api.dto;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;

public record UserResponse(String sicil, String fullName, Role role, Long teamId) {
    public static UserResponse from(AuthUser user) {
        return new UserResponse(user.getSicil(), user.getFullName(), user.getRole(), user.getTeamId());
    }
}
