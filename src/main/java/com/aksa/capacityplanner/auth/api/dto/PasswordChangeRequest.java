package com.aksa.capacityplanner.auth.api.dto;

/**
 * Profil ekranindaki "Şifre Değiştir" formunun govdesi. sicil KASITLI olarak
 * yok - hangi hesabin sifresinin degistigi istekten degil, dogrulanmis access
 * token claim'inden (AuthController) okunur; aksi halde bir kullanici baskasinin
 * sifresini degistirebilirdi.
 *
 * currentPassword, oturum acik olsa bile zorunludur (oturumu calinmis/acik
 * birakilmis bir tarayicinin sifreyi degistirip hesabi ele gecirmesini onler).
 */
public record PasswordChangeRequest(String currentPassword, String newPassword) {
}
