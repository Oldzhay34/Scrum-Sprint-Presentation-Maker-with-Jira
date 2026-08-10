package com.aksa.capacityplanner.auth.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {

    private String sicil;
    private String passwordHash;
    private String fullName;
    private Role role;
    /** PO icin baglandigi ana/varsayilan takim id'si (yeni sunum olusturma vb. varsayilan hedef), ADMIN icin null. */
    private Long teamId;
    /**
     * PO'nun DUZENLEME yetkisi oldugu TUM takimlar (birden fazla takima bakan
     * PO'lar icin, orn. iki ekibi birlikte yuruten kisiler). teamId de her
     * zaman bu listenin bir elemani olmalidir. ADMIN icin bos/null - zaten
     * tum takimlarda yetkili (bkz. PresentationFacade.requireEditAccess).
     */
    private List<Long> teamIds;

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
