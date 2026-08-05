package com.aksa.capacityplanner.auth.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PersonnelJpaRepository
        extends JpaRepository<PersonnelEntity, Long> {

    Optional<PersonnelEntity> findByUsernameIgnoreCase(String username);
}