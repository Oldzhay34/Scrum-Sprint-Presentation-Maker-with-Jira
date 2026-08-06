package com.aksa.capacityplanner.auth.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {

    private String sicil;
    private String passwordHash;
    private String fullName;
    private Role role;
    /** PO icin baglandigi takim id'si, ADMIN icin null (tum takimlara erisir). */
    private Long teamId;

    // Asagidaki alanlar, ileride baglanacak AD/personel servisinin DTO'suyla
    // (company/department/title/ExtensionAttribute4/6/8) birebir ayni ad -
    // simdilik mock degerlerle doluyor, sadece profil sayfasinda salt-okunur
    // gosteriliyor.
    private String company;
    private String department;
    private String title;
    private String extensionAttribute4;
    private String extensionAttribute6;
    private String extensionAttribute8;
}
