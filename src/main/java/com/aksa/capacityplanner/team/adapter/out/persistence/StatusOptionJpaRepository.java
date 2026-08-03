package com.aksa.capacityplanner.team.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StatusOptionJpaRepository extends JpaRepository<StatusOptionJpaEntity, Long> {

    @Query("select s from StatusOptionJpaEntity s where s.teamId is null or s.teamId = :teamId order by s.sortOrder")
    List<StatusOptionJpaEntity> findAvailableForTeam(@Param("teamId") Long teamId);
}
