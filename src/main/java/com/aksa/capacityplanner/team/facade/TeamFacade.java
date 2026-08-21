package com.aksa.capacityplanner.team.facade;

import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.in.TeamMemberUseCase;
import com.aksa.capacityplanner.team.port.in.TeamUseCase;
import com.aksa.capacityplanner.team.port.out.StatusOptionRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamSectorOptionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * API katmaninin domaine dogrudan erismeden kullandigi cephe.
 * Birden fazla use case'i tek noktadan orkestre eder.
 */
@Component
public class TeamFacade {

    private final TeamUseCase teamUseCase;
    private final TeamMemberUseCase teamMemberUseCase;
    private final StatusOptionRepositoryPort statusOptionRepository;
    private final TeamSectorOptionRepositoryPort teamSectorOptionRepository;

    public TeamFacade(TeamUseCase teamUseCase, TeamMemberUseCase teamMemberUseCase,
                       StatusOptionRepositoryPort statusOptionRepository,
                       TeamSectorOptionRepositoryPort teamSectorOptionRepository) {
        this.teamUseCase = teamUseCase;
        this.teamMemberUseCase = teamMemberUseCase;
        this.statusOptionRepository = statusOptionRepository;
        this.teamSectorOptionRepository = teamSectorOptionRepository;
    }

    public Team createTeam(Team team) {
        return teamUseCase.createTeam(team);
    }

    public Team updateTeam(Long id, Team team) {
        return teamUseCase.updateTeam(id, team);
    }

    public Team getTeam(Long id) {
        return teamUseCase.getTeam(id);
    }

    public List<Team> listTeams() {
        return teamUseCase.listTeams();
    }

    public void deleteTeam(Long id) {
        teamUseCase.deleteTeam(id);
    }

    public TeamMember addMember(TeamMember member) {
        return teamMemberUseCase.addMember(member);
    }

    public TeamMember updateMember(Long id, TeamMember member) {
        return teamMemberUseCase.updateMember(id, member);
    }

    public TeamMember changeStatus(Long id, String statusCode) {
        return teamMemberUseCase.changeStatus(id, statusCode);
    }

    public List<TeamMember> listMembers(Long teamId) {
        return teamMemberUseCase.listByTeam(teamId);
    }

    public void deleteMember(Long id) {
        teamMemberUseCase.deleteMember(id);
    }

    public List<StatusOption> listAvailableStatuses(Long teamId) {
        return statusOptionRepository.findAvailableForTeam(teamId);
    }

    public StatusOption addStatusOption(StatusOption statusOption) {
        return statusOptionRepository.save(statusOption);
    }

    public List<com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition> listCustomFields(Long teamId) {
        return teamUseCase.listCustomFields(teamId);
    }

    public com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition addCustomField(
            Long teamId, com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition definition) {
        return teamUseCase.addCustomField(teamId, definition);
    }

    public void removeCustomField(Long teamId, Long fieldId) {
        teamUseCase.removeCustomField(teamId, fieldId);
    }

    /** Takimin Jira'dan senkronize edilen sektor listesi (bkz. JiraSyncProcessor) - elle duzenlenmez. */
    public List<String> listSectorOptions(Long teamId) {
        return teamSectorOptionRepository.findByTeamId(teamId);
    }
}
