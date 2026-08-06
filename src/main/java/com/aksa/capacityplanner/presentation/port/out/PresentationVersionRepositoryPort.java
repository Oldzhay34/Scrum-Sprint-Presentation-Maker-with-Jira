package com.aksa.capacityplanner.presentation.port.out;

import com.aksa.capacityplanner.presentation.domain.PresentationVersion;

import java.util.List;
import java.util.Optional;

public interface PresentationVersionRepositoryPort {
    PresentationVersion save(PresentationVersion version);

    List<PresentationVersion> findByPresentationId(Long presentationId);

    Optional<PresentationVersion> findByPresentationIdAndVersion(Long presentationId, int version);
}
