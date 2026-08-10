package com.aksa.capacityplanner.auth.usecase;

import com.aksa.capacityplanner.auth.api.dto.PasswordChangeRequest;
import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.InvalidCredentialsException;
import com.aksa.capacityplanner.auth.domain.PasswordPolicy;
import com.aksa.capacityplanner.auth.port.in.PasswordUseCase;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import com.aksa.capacityplanner.auth.security.RefreshTokenStore;
import com.aksa.capacityplanner.common.domain.DomainValidationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService implements PasswordUseCase {

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenStore refreshTokenStore;

    public PasswordService(UserRepositoryPort userRepository, PasswordEncoder passwordEncoder,
                            RefreshTokenStore refreshTokenStore) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenStore = refreshTokenStore;
    }

    @Override
    public void changePassword(String sicil, PasswordChangeRequest request, String currentRefreshToken) {
        AuthUser user = userRepository.findBySicil(sicil)
                .orElseThrow(() -> new InvalidCredentialsException("Oturum bulunamadı, tekrar giriş yapın."));

        String currentPassword = request == null ? null : request.currentPassword();
        String newPassword = request == null ? null : request.newPassword();

        // Yanlis "mevcut sifre" icin bilerek InvalidCredentialsException (401)
        // DEGIL, DomainValidationException (400) atiliyor: kullanicinin oturumu
        // gecerli, hatali olan sadece formdaki bir alan. 401 donseydi frontend'in
        // authFetch sarmalayicisi bunu "oturum dustu" sanip once /refresh deneyip
        // istegi bir kez daha tekrarlardi (bkz. apiClient.authFetch).
        if (currentPassword == null || currentPassword.isEmpty()
                || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new DomainValidationException("Mevcut şifreniz hatalı.");
        }

        PasswordPolicy.validate(newPassword);

        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new DomainValidationException("Yeni şifre mevcut şifrenizle aynı olamaz.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Sifre degistiginde eski sifreyle acilmis DIGER oturumlar (baska
        // tarayici/cihaz) gecersiz kilinir - sifre degistirmenin asil amaci
        // zaten erisimi geri almaktir. Istegi yapan tarayicinin kendi refresh
        // token'i korunur ki kullanici kendi ekraninda login'e dusmesin.
        refreshTokenStore.revokeAllForSicil(sicil, currentRefreshToken);
    }
}
