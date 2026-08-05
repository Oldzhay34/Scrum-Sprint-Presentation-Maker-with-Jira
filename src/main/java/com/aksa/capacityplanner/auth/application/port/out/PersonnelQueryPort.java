package com.aksa.capacityplanner.auth.application.port.out;

import com.aksa.capacityplanner.auth.domain.model.Personnel;

import java.util.Optional;

public interface PersonnelQueryPort {

    Optional<Personnel> findByUsername(String username);
}