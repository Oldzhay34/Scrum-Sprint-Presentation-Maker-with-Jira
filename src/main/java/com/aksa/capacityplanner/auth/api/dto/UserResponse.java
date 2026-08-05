package com.aksa.capacityplanner.auth.api.dto;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;

import java.util.List;

/**
 * roles (dizi) ve department alanlari, frontend'in App.jsx'teki mevcut
 * admin/canEdit cozumlemesiyle (bkz. resolveTeamTypeFromDepartment,
 * roles.includes("ADMIN")) uyumlu olmasi icin eklendi - role (tekil) alani
 * geriye donuk uyumluluk icin (orn. ProfilePage) korunuyor.
 */
public record UserResponse(String sicil, String fullName, Role role, Long teamId,
                            String department, List<String> roles) {
    public static UserResponse from(AuthUser user) {
        return new UserResponse(user.getSicil(), user.getFullName(), user.getRole(), user.getTeamId(),
                user.getDepartment(), List.of(user.getRole().name()));
    }

    public static UserResponse from(JwtTokenProvider.AccessTokenClaims claims) {
        return new UserResponse(claims.sicil(), claims.fullName(), claims.role(), claims.teamId(),
                claims.department(), List.of(claims.role().name()));
    }
}
