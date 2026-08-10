package com.aksa.capacityplanner.unit.auth;

import com.aksa.capacityplanner.auth.domain.PasswordPolicy;
import com.aksa.capacityplanner.common.domain.DomainValidationException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyTest {

    @Test
    void validPassword_passes() {
        assertThatCode(() -> PasswordPolicy.validate("Aksa2026x")).doesNotThrowAnyException();
    }

    @Test
    void blankPassword_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate("   "))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("boş");
    }

    @Test
    void nullPassword_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate(null))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void tooShortPassword_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate("Ak2026"))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining(String.valueOf(PasswordPolicy.MIN_LENGTH));
    }

    @Test
    void tooLongPassword_throws() {
        // BCrypt 72 bayttan sonrasini yok saydigi icin sessiz kirpma yerine reddedilmeli.
        String tooLong = "a1" + "x".repeat(PasswordPolicy.MAX_LENGTH);

        assertThatThrownBy(() -> PasswordPolicy.validate(tooLong))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining(String.valueOf(PasswordPolicy.MAX_LENGTH));
    }

    @Test
    void passwordWithWhitespace_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate("Aksa 2026"))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("boşluk");
    }

    @Test
    void passwordWithoutLetter_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate("12345678"))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("harf");
    }

    @Test
    void passwordWithoutDigit_throws() {
        assertThatThrownBy(() -> PasswordPolicy.validate("AksaEnerji"))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("rakam");
    }
}
