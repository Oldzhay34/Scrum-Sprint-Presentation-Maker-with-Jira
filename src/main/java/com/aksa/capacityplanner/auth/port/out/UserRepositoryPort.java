package com.aksa.capacityplanner.auth.port.out;

import com.aksa.capacityplanner.auth.domain.AuthUser;

import java.util.Optional;

public interface UserRepositoryPort {
    Optional<AuthUser> findBySicil(String sicil);
}
