package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.port.out.TeamRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class TeamPersistenceAdapter implements TeamRepositoryPort {

    private final TeamJpaRepository jpaRepository;

    public TeamPersistenceAdapter(TeamJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Team save(Team team) {
        TeamJpaEntity entity = toEntity(team);
        TeamJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Team> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Team> findAll() {
        return jpaRepository.findAll().stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private TeamJpaEntity toEntity(Team team) {
        TeamJpaEntity entity = new TeamJpaEntity();
        entity.setId(team.getId());
        entity.setName(team.getName());
        entity.setDescription(team.getDescription());
        entity.setMaintenanceAllocationPercent(team.getMaintenanceAllocationPercent());
        entity.setDefaultTargetWorkDays(team.getDefaultTargetWorkDays());
        entity.setTeamType(team.getTeamType());
        entity.setJiraProjectKey(team.getJiraProjectKey());
        entity.setJiraBoardId(team.getJiraBoardId());
        return entity;
    }

    private Team toDomain(TeamJpaEntity entity) {
        return new Team(entity.getId(), entity.getName(), entity.getDescription(),
                entity.getMaintenanceAllocationPercent(), entity.getDefaultTargetWorkDays(), entity.getTeamType(),
                entity.getJiraProjectKey(), entity.getJiraBoardId());
    }
}
