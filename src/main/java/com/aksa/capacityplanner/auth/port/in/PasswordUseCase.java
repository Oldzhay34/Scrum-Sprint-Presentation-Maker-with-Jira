package com.aksa.capacityplanner.auth.port.in;

import com.aksa.capacityplanner.auth.api.dto.PasswordChangeRequest;

/**
 * Oturum acmis kullanicinin KENDI sifresini degistirmesi. SessionUseCase
 * (giris/yenileme/cikis) ve ProfileUseCase'ten (organizasyonel alanlar) ayri
 * bir port: kimlik dogrulama sirri degistigi icin farkli bir guvenlik
 * sorumlulugu tasir ve profil kaydetmeyle ayni akista olmamalidir.
 */
public interface PasswordUseCase {

    /**
     * Mevcut sifreyi dogrular, yeni sifreyi (PasswordPolicy'e uyuyorsa)
     * hash'leyip kaydeder ve kullanicinin DIGER tum oturumlarini kapatir.
     *
     * @param sicil               token claim'inden gelen, sifresi degisecek hesap
     * @param request             mevcut + yeni sifre
     * @param currentRefreshToken istegi yapan tarayicinin refresh token'i (cookie'den);
     *                            bu oturum ACIK KALIR, kullanici sifre degistirdi diye
     *                            kendi ekraninda login'e dusmez. null verilirse
     *                            kullanicinin tum oturumlari kapatilir.
     */
    void changePassword(String sicil, PasswordChangeRequest request, String currentRefreshToken);
}
