package com.aksa.capacityplanner.auth.port.in;

import com.aksa.capacityplanner.auth.domain.AuthUser;

public interface AuthUseCase {

    TokenPair login(String sicil, String password);

    TokenPair refresh(String refreshToken);

    void logout(String refreshToken);

    record TokenPair(AuthUser user, String accessToken, String refreshToken) {
    }
}
