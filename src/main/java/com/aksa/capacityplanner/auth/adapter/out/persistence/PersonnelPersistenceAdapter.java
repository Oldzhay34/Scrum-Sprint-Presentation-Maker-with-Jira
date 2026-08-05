package com.aksa.capacityplanner.auth.adapter.out.persistence;

import com.aksa.capacityplanner.auth.application.port.out.PersonnelQueryPort;
import com.aksa.capacityplanner.auth.domain.model.Personnel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PersonnelPersistenceAdapter
        implements PersonnelQueryPort {

    private final PersonnelJpaRepository repository;

    @Override
    public Optional<Personnel> findByUsername(String username) {

        return repository
                .findByUsernameIgnoreCase(username.trim())
                .map(this::mapToDomain);
    }

    private Personnel mapToDomain(PersonnelEntity entity) {

        return new Personnel(
                entity.getId(),
                entity.getUsername(),
                entity.getPassword(),
                entity.getCompany(),
                entity.getDepartment(),
                entity.getTitle(),
                entity.getExtensionAttribute4(),
                entity.getExtensionAttribute6(),
                entity.getExtensionAttribute8(),
                parseRoles(entity.getRoles()),
                entity.isActive()
        );
    }

    private List<String> parseRoles(String roles) {

        if (roles == null || roles.isBlank()) {
            return List.of("USER");
        }

        return Arrays.stream(roles.split(","))
                .map(String::trim)
                .filter(role -> !role.isBlank())
                .toList();
    }
}