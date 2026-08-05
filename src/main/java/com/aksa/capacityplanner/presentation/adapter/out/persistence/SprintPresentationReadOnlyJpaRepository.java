package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SprintPresentationReadOnlyJpaRepository extends JpaRepository<SprintPresentationReadOnlyJpaEntity, Long> {
    Optional<SprintPresentationReadOnlyJpaEntity> findById(Long id);

    List<SprintPresentationReadOnlyJpaEntity> findByTeamId(Long teamId);
}
