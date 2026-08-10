package com.aksa.capacityplanner.unit.auth;

import com.aksa.capacityplanner.auth.api.dto.PasswordChangeRequest;
import com.aksa.capacityplanner.auth.domain.AuthUser;
import com.aksa.capacityplanner.auth.domain.InvalidCredentialsException;
import com.aksa.capacityplanner.auth.domain.Role;
import com.aksa.capacityplanner.auth.port.out.UserRepositoryPort;
import com.aksa.capacityplanner.auth.security.JwtProperties;
import com.aksa.capacityplanner.auth.security.RefreshTokenStore;
import com.aksa.capacityplanner.auth.usecase.PasswordService;
import com.aksa.capacityplanner.common.domain.DomainValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordServiceTest {

    private static final String SICIL = "29547";
    private static final String CURRENT_PASSWORD = "Mevcut123";
    private static final String NEW_PASSWORD = "Yeni12345";

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final InMemoryUserRepository userRepository = new InMemoryUserRepository();
    private final RefreshTokenStore refreshTokenStore = new RefreshTokenStore(new JwtProperties());

    private PasswordService passwordService;

    @BeforeEach
    void setUp() {
        userRepository.put(user(SICIL, CURRENT_PASSWORD));
        passwordService = new PasswordService(userRepository, passwordEncoder, refreshTokenStore);
    }

    @Test
    void changePassword_replacesHash() {
        passwordService.changePassword(SICIL, new PasswordChangeRequest(CURRENT_PASSWORD, NEW_PASSWORD), null);

        String storedHash = userRepository.findBySicil(SICIL).orElseThrow().getPasswordHash();
        assertThat(passwordEncoder.matches(NEW_PASSWORD, storedHash)).isTrue();
        assertThat(passwordEncoder.matches(CURRENT_PASSWORD, storedHash)).isFalse();
    }

    @Test
    void wrongCurrentPassword_throwsAndKeepsHash() {
        String hashBefore = userRepository.findBySicil(SICIL).orElseThrow().getPasswordHash();

        assertThatThrownBy(() -> passwordService.changePassword(
                SICIL, new PasswordChangeRequest("Hatali123", NEW_PASSWORD), null))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("Mevcut şifreniz hatalı");

        assertThat(userRepository.findBySicil(SICIL).orElseThrow().getPasswordHash()).isEqualTo(hashBefore);
    }

    @Test
    void blankCurrentPassword_throws() {
        assertThatThrownBy(() -> passwordService.changePassword(
                SICIL, new PasswordChangeRequest("", NEW_PASSWORD), null))
                .isInstanceOf(DomainValidationException.class);
    }

    @Test
    void newPasswordViolatingPolicy_throwsAndKeepsHash() {
        String hashBefore = userRepository.findBySicil(SICIL).orElseThrow().getPasswordHash();

        assertThatThrownBy(() -> passwordService.changePassword(
                SICIL, new PasswordChangeRequest(CURRENT_PASSWORD, "kisa1"), null))
                .isInstanceOf(DomainValidationException.class);

        assertThat(userRepository.findBySicil(SICIL).orElseThrow().getPasswordHash()).isEqualTo(hashBefore);
    }

    @Test
    void newPasswordSameAsCurrent_throws() {
        assertThatThrownBy(() -> passwordService.changePassword(
                SICIL, new PasswordChangeRequest(CURRENT_PASSWORD, CURRENT_PASSWORD), null))
                .isInstanceOf(DomainValidationException.class)
                .hasMessageContaining("aynı olamaz");
    }

    @Test
    void unknownUser_throwsInvalidCredentials() {
        assertThatThrownBy(() -> passwordService.changePassword(
                "00000", new PasswordChangeRequest(CURRENT_PASSWORD, NEW_PASSWORD), null))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void changePassword_revokesOtherSessionsButKeepsCurrentOne() {
        String currentSession = refreshTokenStore.issue(SICIL);
        String otherSession = refreshTokenStore.issue(SICIL);
        String anotherUserSession = refreshTokenStore.issue("10001");

        passwordService.changePassword(SICIL, new PasswordChangeRequest(CURRENT_PASSWORD, NEW_PASSWORD), currentSession);

        assertThat(refreshTokenStore.sicilFor(currentSession)).contains(SICIL);
        assertThat(refreshTokenStore.sicilFor(otherSession)).isEmpty();
        assertThat(refreshTokenStore.sicilFor(anotherUserSession)).contains("10001");
    }

    @Test
    void changePasswordWithoutCurrentSession_revokesAllSessionsOfUser() {
        String firstSession = refreshTokenStore.issue(SICIL);
        String secondSession = refreshTokenStore.issue(SICIL);

        passwordService.changePassword(SICIL, new PasswordChangeRequest(CURRENT_PASSWORD, NEW_PASSWORD), null);

        assertThat(refreshTokenStore.sicilFor(firstSession)).isEmpty();
        assertThat(refreshTokenStore.sicilFor(secondSession)).isEmpty();
    }

    private AuthUser user(String sicil, String rawPassword) {
        AuthUser user = new AuthUser();
        user.setSicil(sicil);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFullName("Test Kullanıcı");
        user.setRole(Role.PO);
        user.setTeamId(3L);
        user.setTeamIds(List.of(3L));
        return user;
    }

    /** Mockito yerine, port'un davranisini birebir tasiyan kucuk bir sahte kayit deposu. */
    private static final class InMemoryUserRepository implements UserRepositoryPort {

        private final Map<String, AuthUser> usersBySicil = new HashMap<>();

        void put(AuthUser user) {
            usersBySicil.put(user.getSicil(), user);
        }

        @Override
        public Optional<AuthUser> findBySicil(String sicil) {
            return Optional.ofNullable(usersBySicil.get(sicil));
        }

        @Override
        public void save(AuthUser user) {
            usersBySicil.put(user.getSicil(), user);
        }
    }
}
