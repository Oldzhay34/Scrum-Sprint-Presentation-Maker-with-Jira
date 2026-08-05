package com.aksa.capacityplanner.team.domain;

import java.util.Locale;

/**
 * Bilinen takim tipleri (orn. RPA, Is Zekasi). Login sonrasi JWT'deki
 * "department" claim'inden (personel HR sistemindeki Departman_Adi) buraya
 * cozumlenir; admin rolu tum takimlara erisebilecek. fteTrackingEnabled, RPA
 * gibi FTE (Full Time Equivalent) takibi yapan takimlari, bu kavrami olmayan
 * takimlardan (orn. Is Zekasi) ayirt eder.
 */
public enum TeamType {
    RPA(true),
    IS_ZEKASI(false),
    URUN_GELISTIRME(false),
    YAPAY_ZEKA(false),
    DIJITAL_UYGULAMALAR(false),
    KONUM_TABANLI_URUN_GELISTIRME(false),
    DSYS(false),
    GENEL(false);

    private final boolean fteTrackingEnabled;

    TeamType(boolean fteTrackingEnabled) {
        this.fteTrackingEnabled = fteTrackingEnabled;
    }

    public boolean isFteTrackingEnabled() {
        return fteTrackingEnabled;
    }

    /**
     * Personel departman adindan (orn. "RPA Ekibi", "İş Zekası Ekibi") takim
     * tipini cozumler - frontend'deki excelParsers.js/detectTeamType ile ayni
     * basit "isim icinde arama" mantigi (isim degisikliklerine/varyasyonlarina
     * karsi dayanikli, kod degisikligi gerektirmez). Eslesme bulunamazsa GENEL
     * doner - cagiran taraf (orn. duzenleme yetkisi kontrolu) bunu "bilinen iki
     * takimdan biri degil" olarak ele almali.
     */
    public static TeamType fromDepartmentName(String department) {
        if (department == null || department.isBlank()) {
            return GENEL;
        }
        String d = department.toLowerCase(Locale.forLanguageTag("tr"));
        if (d.contains("rpa")) {
            return RPA;
        }
        if (d.contains("yapay")) {
            return YAPAY_ZEKA;
        }
        if (d.contains("zeka")) {
            return IS_ZEKASI;
        }
        if (d.contains("konum")) {
            return KONUM_TABANLI_URUN_GELISTIRME;
        }
        if (d.contains("ürün") || d.contains("urun")) {
            return URUN_GELISTIRME;
        }
        if (d.contains("dijital")) {
            return DIJITAL_UYGULAMALAR;
        }
        if (d.contains("doküman") || d.contains("dokuman") || d.contains("dsys")) {
            return DSYS;
        }
        return GENEL;
    }
}
