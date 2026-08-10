package com.aksa.capacityplanner.auth.usecase;

import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.InvalidCredentialsException;
import com.aksa.capacityplanner.auth.port.in.SessionUseCase;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;
import com.aksa.capacityplanner.auth.security.RefreshTokenStore;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class SessionService implements SessionUseCase {

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenStore refreshTokenStore;

    public SessionService(UserRepositoryPort userRepository, PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider, RefreshTokenStore refreshTokenStore) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenStore = refreshTokenStore;
    }

    @Override
    public TokenPair login(String sicil, String password) {
        AuthUser user = userRepository.findBySicil(sicil)
                .orElseThrow(() -> new InvalidCredentialsException("Sicil no veya şifre hatalı."));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException("Sicil no veya şifre hatalı.");
        }
        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshToken = refreshTokenStore.issue(user.getSicil());
        return new TokenPair(user, accessToken, refreshToken);
    }

    @Override
    public TokenPair refresh(String refreshToken) {
        String sicil = refreshTokenStore.sicilFor(refreshToken)
                .orElseThrow(() -> new InvalidCredentialsException("Oturum süresi doldu, tekrar giriş yapın."));
        AuthUser user = userRepository.findBySicil(sicil)
                .orElseThrow(() -> new InvalidCredentialsException("Oturum süresi doldu, tekrar giriş yapın."));
        // Rotate: eski refresh token'i gecersiz kil, yenisini ver (replay saldirisina karsi).
        refreshTokenStore.revoke(refreshToken);
        String newAccessToken = jwtTokenProvider.createAccessToken(user);
        String newRefreshToken = refreshTokenStore.issue(user.getSicil());
        return new TokenPair(user, newAccessToken, newRefreshToken);
    }

    @Override
    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenStore.revoke(refreshToken);
        }
    }
}
