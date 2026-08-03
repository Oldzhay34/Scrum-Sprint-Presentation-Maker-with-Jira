package com.aksa.capacityplanner.team.port.out;

import com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition;

import java.util.List;

public interface TeamCustomFieldDefinitionRepositoryPort {
    TeamCustomFieldDefinition save(TeamCustomFieldDefinition definition);

    List<TeamCustomFieldDefinition> findByTeamId(Long teamId);

    void deleteById(Long id);
}
