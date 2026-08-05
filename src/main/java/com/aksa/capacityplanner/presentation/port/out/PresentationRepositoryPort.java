package com.aksa.capacityplanner.presentation.port.out;

import com.aksa.capacityplanner.presentation.domain.SprintPresentation;

import java.util.List;
import java.util.Optional;

public interface PresentationRepositoryPort {
    SprintPresentation save(SprintPresentation presentation);

    Optional<SprintPresentation> findById(Long id);

    Optional<SprintPresentation> findByTeamIdAndSprintNo(Long teamId, String sprintNo);

    List<SprintPresentation> findByTeamId(Long teamId);
}
