package com.aksa.capacityplanner.team.port.out;

import com.aksa.capacityplanner.team.domain.StatusOption;

import java.util.List;
import java.util.Optional;

public interface StatusOptionRepositoryPort {
    StatusOption save(StatusOption statusOption);

    Optional<StatusOption> findById(Long id);

    /** teamId null olan genel statuler + verilen takima ozgu statuler. */
    List<StatusOption> findAvailableForTeam(Long teamId);

    void deleteById(Long id);
}
