package com.aksa.capacityplanner.team.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMemberJpaRepository extends JpaRepository<TeamMemberJpaEntity, Long> {
    List<TeamMemberJpaEntity> findByTeamId(Long teamId);
}
