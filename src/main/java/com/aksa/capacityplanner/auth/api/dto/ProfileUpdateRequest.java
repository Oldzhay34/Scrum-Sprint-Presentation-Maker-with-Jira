package com.aksa.capacityplanner.auth.api.dto;

/**
 * Profil sayfasindan kendi bilgilerini dolduran/guncelleyen kullanicinin
 * gonderdigi govde. sicil ve role kasitli olarak burada YOK - kullanici
 * kendi rolunu veya sicil numarasini degistiremez, sadece tanimlayici/
 * organizasyonel alanlarini doldurabilir.
 */
public record ProfileUpdateRequest(String fullName, Long teamId, String company, String department,
                                    String title, String extensionAttribute4, String extensionAttribute6,
                                    String extensionAttribute8) {
}
