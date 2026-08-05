package com.aksa.capacityplanner.auth.api.dto;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.Role;

/**
 * Profil sayfasinda salt-okunur gosterilen genisletilmis kullanici bilgisi.
 * Alan adlari (company/department/title/ExtensionAttribute4/6/8), ileride
 * baglanacak AD/personel servisinin DTO'suyla birebir ayni tutuluyor.
 */
public record ProfileResponse(String sicil, String fullName, Role role, Long teamId,
                               String company, String department, String title,
                               String extensionAttribute4, String extensionAttribute6, String extensionAttribute8) {
    public static ProfileResponse from(AuthUser user) {
        return new ProfileResponse(user.getSicil(), user.getFullName(), user.getRole(), user.getTeamId(),
                user.getCompany(), user.getDepartment(), user.getTitle(),
                user.getExtensionAttribute4(), user.getExtensionAttribute6(), user.getExtensionAttribute8());
    }
}
