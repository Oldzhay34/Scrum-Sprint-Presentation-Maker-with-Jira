package com.aksa.capacityplanner.team.port.in;

import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition;

import java.util.List;

public interface TeamUseCase {
    Team createTeam(Team team);

    Team updateTeam(Long id, Team team);

    Team getTeam(Long id);

    List<Team> listTeams();

    void deleteTeam(Long id);

    TeamCustomFieldDefinition addCustomField(Long teamId, TeamCustomFieldDefinition definition);

    void removeCustomField(Long teamId, Long fieldId);

    List<TeamCustomFieldDefinition> listCustomFields(Long teamId);
}
