package com.aksa.capacityplanner.auth.domain;

import com.aksa.capacityplanner.common.domain.DomainValidationException;

/**
 * Yeni sifrenin uymasi gereken kurallar TEK noktada. Kural degisikligi
 * (orn. minimum uzunlugun artmasi) sadece burayi ilgilendirir; sifre
 * degistirme akisi (PasswordService) veya ileride eklenecek "sifre sifirlama"
 * akisi ayni dogrulamayi tekrar yazmak zorunda kalmaz.
 *
 * Bilerek Bean Validation (@Size vb.) yerine domain kurali olarak yazildi:
 * @Valid ihlallerinde Spring'in urettigi govde Ingilizce/teknik bir mesaj
 * tasiyor, buradan atilan DomainValidationException ise GlobalExceptionHandler
 * uzerinden 400 + kullaniciya dogrudan gosterilebilecek Turkce mesaj olarak
 * doner (frontend PasswordChangeModal bu mesaji oldugu gibi basar).
 */
public final class PasswordPolicy {

    public static final int MIN_LENGTH = 8;
    /** BCrypt girdinin ilk 72 baytindan sonrasini yok sayar - sessizce kirpilmasin, bastan reddedelim. */
    public static final int MAX_LENGTH = 72;

    private PasswordPolicy() {
    }

    /** Kurala uymayan ilk durumda DomainValidationException firlatir; uygunsa sessizce doner. */
    public static void validate(String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new DomainValidationException("Yeni şifre boş olamaz.");
        }
        if (rawPassword.length() < MIN_LENGTH) {
            throw new DomainValidationException("Yeni şifre en az " + MIN_LENGTH + " karakter olmalı.");
        }
        if (rawPassword.length() > MAX_LENGTH) {
            throw new DomainValidationException("Yeni şifre en fazla " + MAX_LENGTH + " karakter olabilir.");
        }
        if (rawPassword.chars().anyMatch(Character::isWhitespace)) {
            throw new DomainValidationException("Yeni şifre boşluk karakteri içeremez.");
        }
        if (rawPassword.chars().noneMatch(Character::isLetter)) {
            throw new DomainValidationException("Yeni şifre en az bir harf içermeli.");
        }
        if (rawPassword.chars().noneMatch(Character::isDigit)) {
            throw new DomainValidationException("Yeni şifre en az bir rakam içermeli.");
        }
    }
}
