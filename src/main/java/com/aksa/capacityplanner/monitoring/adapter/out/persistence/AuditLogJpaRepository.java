package com.aksa.capacityplanner.monitoring.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface AuditLogJpaRepository extends JpaRepository<AuditLogJpaEntity, Long>, JpaSpecificationExecutor<AuditLogJpaEntity> {

    long countByCreatedAtGreaterThanEqual(Instant from);

    @Query("select count(distinct a.actorSicil) from AuditLogJpaEntity a where a.createdAt >= :from and a.actorSicil is not null")
    long countDistinctActorsSince(Instant from);

    AuditLogJpaEntity findTopByOrderByCreatedAtDesc();

    @Query("select a.actionLabel from AuditLogJpaEntity a where a.createdAt >= :from group by a.actionLabel order by count(a) desc")
    List<String> findTopActionLabelsSince(Instant from);

    @Query("select distinct a.actorSicil as sicil, a.actorName as name from AuditLogJpaEntity a " +
            "where a.actorSicil is not null order by a.actorName")
    List<ActorProjection> findDistinctActors();

    @Query("select distinct a.actionCode as code, a.actionLabel as label from AuditLogJpaEntity a order by a.actionLabel")
    List<ActionProjection> findDistinctActions();

    interface ActorProjection {
        String getSicil();
        String getName();
    }

    interface ActionProjection {
        String getCode();
        String getLabel();
    }
}
