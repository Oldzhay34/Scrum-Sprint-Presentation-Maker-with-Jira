package com.aksa.capacityplanner.team.port.out;

import com.aksa.capacityplanner.team.domain.TeamMember;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepositoryPort {
    TeamMember save(TeamMember member);

    Optional<TeamMember> findById(Long id);

    List<TeamMember> findByTeamId(Long teamId);

    void deleteById(Long id);
}
