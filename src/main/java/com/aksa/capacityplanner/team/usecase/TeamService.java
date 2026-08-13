package com.aksa.capacityplanner.team.usecase;

import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition;
import com.aksa.capacityplanner.team.domain.TeamType;
import com.aksa.capacityplanner.team.port.in.TeamUseCase;
import com.aksa.capacityplanner.team.port.out.TeamCustomFieldDefinitionRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TeamService implements TeamUseCase {

    private final TeamRepositoryPort teamRepository;
    private final TeamCustomFieldDefinitionRepositoryPort customFieldRepository;

    public TeamService(TeamRepositoryPort teamRepository, TeamCustomFieldDefinitionRepositoryPort customFieldRepository) {
        this.teamRepository = teamRepository;
        this.customFieldRepository = customFieldRepository;
    }

    @Override
    public Team createTeam(Team team) {
        if (team.getMaintenanceAllocationPercent() == null) {
            team.setMaintenanceAllocationPercent(BigDecimal.ZERO);
        }
        if (team.getTeamType() == null) {
            team.setTeamType(TeamType.GENEL);
        }
        return teamRepository.save(team);
    }

    @Override
    public Team updateTeam(Long id, Team team) {
        Team existing = getTeam(id);
        existing.setName(team.getName());
        existing.setDescription(team.getDescription());
        existing.setMaintenanceAllocationPercent(team.getMaintenanceAllocationPercent());
        existing.setDefaultTargetWorkDays(team.getDefaultTargetWorkDays());
        existing.setTeamType(team.getTeamType() == null ? existing.getTeamType() : team.getTeamType());
        existing.setJiraProjectKey(team.getJiraProjectKey());
        existing.setJiraBoardId(team.getJiraBoardId());
        return teamRepository.save(existing);
    }

    @Override
    public Team getTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Takim bulunamadi: id=" + id));
    }

    @Override
    public List<Team> listTeams() {
        return teamRepository.findAll();
    }

    @Override
    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }

    @Override
    public TeamCustomFieldDefinition addCustomField(Long teamId, TeamCustomFieldDefinition definition) {
        getTeam(teamId);
        definition.setTeamId(teamId);
        return customFieldRepository.save(definition);
    }

    @Override
    public void removeCustomField(Long teamId, Long fieldId) {
        customFieldRepository.deleteById(fieldId);
    }

    @Override
    public List<TeamCustomFieldDefinition> listCustomFields(Long teamId) {
        return customFieldRepository.findByTeamId(teamId);
    }
}
