package com.aksa.capacityplanner.auth.facade;

import com.aksa.capacityplanner.auth.api.dto.ProfileUpdateRequest;
import com.aksa.capacityplanner.auth.port.in.ProfileUseCase;
import com.aksa.capacityplanner.auth.port.in.SessionUseCase;
import org.springframework.stereotype.Component;

/**
 * API katmaninin dogrudan erismeden kullandigi cephe - SessionUseCase
 * (giris/yenileme/cikis) ve ProfileUseCase'i (kendi profilini guncelleme)
 * tek noktadan orkestre eder (bkz. team/facade/TeamFacade ile ayni desen).
 */
@Component
public class AuthFacade {

    private final SessionUseCase sessionUseCase;
    private final ProfileUseCase profileUseCase;

    public AuthFacade(SessionUseCase sessionUseCase, ProfileUseCase profileUseCase) {
        this.sessionUseCase = sessionUseCase;
        this.profileUseCase = profileUseCase;
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
}
