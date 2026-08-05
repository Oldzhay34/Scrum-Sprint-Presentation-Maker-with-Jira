package com.aksa.capacityplanner.auth.adapter.in.web;

import com.aksa.capacityplanner.team.domain.TeamType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Halihazirda gecerli bir JWT ile giris yapmis kullanicinin, o token'in
 * claim'lerinden (bkz. JwtTokenAdapter - department/roles) cozumlenen takim
 * tipini ve admin durumunu doner. Login/kimlik dogrulama akisinin kendisine
 * (login/personnel) dokunmaz - sadece zaten dogrulanmis (SecurityConfig'in
 * oauth2ResourceServer'i tarafindan) bir JWT'nin claim'lerini okur.
 */
@RestController
@RequestMapping("/api/v1/me")
public class CurrentUserController {

    @GetMapping
    public CurrentUserDto me(@AuthenticationPrincipal Jwt jwt) {
        String department = jwt.getClaimAsString("department");
        List<String> roles = jwt.getClaimAsStringList("roles");
        TeamType teamType = TeamType.fromDepartmentName(department);
        boolean admin = roles != null && roles.contains("ADMIN");
        return new CurrentUserDto(jwt.getSubject(), department, teamType, admin);
    }

    public record CurrentUserDto(String username, String department, TeamType teamType, boolean admin) {
    }
}
