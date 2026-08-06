package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PresentationVersionJpaRepository extends JpaRepository<PresentationVersionJpaEntity, Long> {
    List<PresentationVersionJpaEntity> findByPresentationIdOrderByVersionDesc(Long presentationId);

    Optional<PresentationVersionJpaEntity> findByPresentationIdAndVersion(Long presentationId, int version);

    void deleteByPresentationIdAndVersionGreaterThan(Long presentationId, int version);
}
