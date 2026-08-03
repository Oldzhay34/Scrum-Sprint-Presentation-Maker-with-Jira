package com.aksa.capacityplanner.team.port.out;

import com.aksa.capacityplanner.team.domain.Team;

import java.util.List;
import java.util.Optional;

public interface TeamRepositoryPort {
    Team save(Team team);

    Optional<Team> findById(Long id);

    List<Team> findAll();

    void deleteById(Long id);
}
