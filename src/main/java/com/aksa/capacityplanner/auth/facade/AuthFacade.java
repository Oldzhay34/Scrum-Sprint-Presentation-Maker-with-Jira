package com.aksa.capacityplanner.auth.facade;

import com.aksa.capacityplanner.auth.api.dto.PasswordChangeRequest;
import com.aksa.capacityplanner.auth.api.dto.ProfileUpdateRequest;
import com.aksa.capacityplanner.auth.port.in.PasswordUseCase;
import com.aksa.capacityplanner.auth.port.in.ProfileUseCase;
import com.aksa.capacityplanner.auth.port.in.SessionUseCase;
import org.springframework.stereotype.Component;

/**
 * API katmaninin dogrudan erismeden kullandigi cephe - SessionUseCase
 * (giris/yenileme/cikis), ProfileUseCase (kendi profilini guncelleme) ve
 * PasswordUseCase'i (kendi sifresini degistirme) tek noktadan orkestre eder
 * (bkz. team/facade/TeamFacade ile ayni desen).
 */
@Component
public class AuthFacade {

    private final SessionUseCase sessionUseCase;
    private final ProfileUseCase profileUseCase;
    private final PasswordUseCase passwordUseCase;

    public AuthFacade(SessionUseCase sessionUseCase, ProfileUseCase profileUseCase, PasswordUseCase passwordUseCase) {
        this.sessionUseCase = sessionUseCase;
        this.profileUseCase = profileUseCase;
        this.passwordUseCase = passwordUseCase;
    }

    public SessionUseCase.TokenPair login(String sicil, String password) {
        return sessionUseCase.login(sicil, password);
    }

    public SessionUseCase.TokenPair refresh(String refreshToken) {
        return sessionUseCase.refresh(refreshToken);
    }

    public void logout(String refreshToken) {
        sessionUseCase.logout(refreshToken);
    }

    public ProfileUseCase.ProfileUpdateResult updateProfile(String sicil, ProfileUpdateRequest request) {
        return profileUseCase.updateProfile(sicil, request);
    }

    public void changePassword(String sicil, PasswordChangeRequest request, String currentRefreshToken) {
        passwordUseCase.changePassword(sicil, request, currentRefreshToken);
    }
}
