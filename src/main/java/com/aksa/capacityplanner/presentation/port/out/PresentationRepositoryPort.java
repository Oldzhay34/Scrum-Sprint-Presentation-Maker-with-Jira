package com.aksa.capacityplanner.presentation.port.out;

import com.aksa.capacityplanner.presentation.domain.SprintPresentation;

import java.util.List;
import java.util.Optional;

public interface PresentationRepositoryPort {
    SprintPresentation save(SprintPresentation presentation);

    Optional<SprintPresentation> findById(Long id);

    Optional<SprintPresentation> findByTeamIdAndSprintNo(Long teamId, String sprintNo);

    List<SprintPresentation> findByTeamId(Long teamId);

    /** sprint_presentations_readonly view'i uzerinden okur (bkz. V5) - salt-okunur goruntuleme yollari icin. */
    Optional<SprintPresentation> findByIdReadOnly(Long id);

    /** sprint_presentations_readonly view'i uzerinden okur (bkz. V5) - salt-okunur goruntuleme yollari icin. */
    List<SprintPresentation> findByTeamIdReadOnly(Long teamId);
}
