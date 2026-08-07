package com.aksa.capacityplanner.auth.api;

import com.aksa.capacityplanner.auth.api.dto.LoginRequest;
import com.aksa.capacityplanner.auth.api.dto.ProfileResponse;
import com.aksa.capacityplanner.auth.api.dto.UserResponse;
import com.aksa.capacityplanner.auth.domain.InvalidCredentialsException;
import com.aksa.capacityplanner.auth.port.in.AuthUseCase;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import com.aksa.capacityplanner.auth.security.AuthCookieFactory;
import com.aksa.capacityplanner.auth.security.CookieNames;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUseCase authUseCase;
    private final AuthCookieFactory cookieFactory;
    private final UserRepositoryPort userRepository;

    public AuthController(AuthUseCase authUseCase, AuthCookieFactory cookieFactory, UserRepositoryPort userRepository) {
        this.authUseCase = authUseCase;
        this.cookieFactory = cookieFactory;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthUseCase.TokenPair tokens = authUseCase.login(request.sicil(), request.password());
        return withAuthCookies(tokens);
    }

    @PostMapping("/refresh")
    public ResponseEntity<UserResponse> refresh(HttpServletRequest request) {
        String refreshToken = findCookie(request, CookieNames.REFRESH_TOKEN)
                .orElseThrow(() -> new InvalidCredentialsException("Oturum bulunamadı, tekrar giriş yapın."));
        AuthUseCase.TokenPair tokens = authUseCase.refresh(refreshToken);
        return withAuthCookies(tokens);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        findCookie(request, CookieNames.REFRESH_TOKEN).ifPresent(authUseCase::logout);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieFactory.expiredAccessTokenCookie().toString())
                .header(HttpHeaders.SET_COOKIE, cookieFactory.expiredRefreshTokenCookie().toString())
                .header(HttpHeaders.SET_COOKIE, cookieFactory.expiredCsrfTokenCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof JwtTokenProvider.AccessTokenClaims claims)) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(UserResponse.from(claims));
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> profile(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof JwtTokenProvider.AccessTokenClaims claims)) {
            return ResponseEntity.status(401).build();
        }
        return userRepository.findBySicil(claims.sicil())
                .map(user -> ResponseEntity.ok(ProfileResponse.from(user)))
                .orElseGet(() -> ResponseEntity.status(401).build());
    }

    private ResponseEntity<UserResponse> withAuthCookies(AuthUseCase.TokenPair tokens) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieFactory.accessTokenCookie(tokens.accessToken()).toString())
                .header(HttpHeaders.SET_COOKIE, cookieFactory.refreshTokenCookie(tokens.refreshToken()).toString())
                .header(HttpHeaders.SET_COOKIE, cookieFactory.csrfTokenCookie().toString())
                .body(UserResponse.from(tokens.user()));
    }

    private Optional<String> findCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return List.of(request.getCookies()).stream()
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }
}
