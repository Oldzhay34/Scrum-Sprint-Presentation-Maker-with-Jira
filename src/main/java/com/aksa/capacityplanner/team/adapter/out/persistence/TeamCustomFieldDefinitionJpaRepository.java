package com.aksa.capacityplanner.team.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamCustomFieldDefinitionJpaRepository extends JpaRepository<TeamCustomFieldDefinitionJpaEntity, Long> {
    List<TeamCustomFieldDefinitionJpaEntity> findByTeamId(Long teamId);
}
