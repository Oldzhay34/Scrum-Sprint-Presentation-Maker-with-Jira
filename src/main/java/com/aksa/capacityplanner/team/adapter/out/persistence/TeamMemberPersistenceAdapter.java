package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@Component
public class TeamMemberPersistenceAdapter implements TeamMemberRepositoryPort {

    private final TeamMemberJpaRepository jpaRepository;

    public TeamMemberPersistenceAdapter(TeamMemberJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public TeamMember save(TeamMember member) {
        TeamMemberJpaEntity entity = toEntity(member);
        TeamMemberJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<TeamMember> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<TeamMember> findByTeamId(Long teamId) {
        return jpaRepository.findByTeamId(teamId).stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private TeamMemberJpaEntity toEntity(TeamMember member) {
        TeamMemberJpaEntity entity = new TeamMemberJpaEntity();
        entity.setId(member.getId());
        entity.setTeamId(member.getTeamId());
        entity.setFullName(member.getFullName());
        entity.setRole(member.getRole());
        entity.setEmail(member.getEmail());
        entity.setStartDate(member.getStartDate());
        entity.setStatusCode(member.getStatusCode());
        entity.setTargetWorkDays(member.getTargetWorkDays());
        entity.setTargetWorkDaysOverridden(member.isTargetWorkDaysOverridden());
        entity.setCustomFieldValues(member.getCustomFieldValues() != null
                ? new HashMap<>(member.getCustomFieldValues()) : new HashMap<>());
        return entity;
    }

    private TeamMember toDomain(TeamMemberJpaEntity entity) {
        TeamMember member = new TeamMember(entity.getId(), entity.getTeamId(), entity.getFullName(),
                entity.getRole(), entity.getEmail(), entity.getStartDate(), entity.getStatusCode(),
                entity.getTargetWorkDays(), entity.isTargetWorkDaysOverridden());
        member.setCustomFieldValues(entity.getCustomFieldValues() != null
                ? new HashMap<>(entity.getCustomFieldValues()) : new HashMap<>());
        return member;
    }
}
