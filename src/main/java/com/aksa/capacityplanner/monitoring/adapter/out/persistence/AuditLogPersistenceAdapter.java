package com.aksa.capacityplanner.monitoring.adapter.out.persistence;

import com.aksa.capacityplanner.monitoring.domain.ActionOption;
import com.aksa.capacityplanner.monitoring.domain.ActorOption;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import com.aksa.capacityplanner.monitoring.domain.AuditLogPage;
import com.aksa.capacityplanner.monitoring.domain.AuditSummary;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class AuditLogPersistenceAdapter implements AuditLogRepositoryPort {

    private final AuditLogJpaRepository jpaRepository;

    public AuditLogPersistenceAdapter(AuditLogJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public AuditLog save(AuditLog entry) {
        AuditLogJpaEntity entity = toEntity(entry);
        AuditLogJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public AuditLogPage search(AuditLogFilter filter, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = jpaRepository.findAll(AuditLogSpecifications.fromFilter(filter), pageable);
        return new AuditLogPage(result.getContent().stream().map(this::toDomain).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Override
    public AuditSummary summary() {
        Instant startOfToday = Instant.now().atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        long actionsToday = jpaRepository.countByCreatedAtGreaterThanEqual(startOfToday);
        long activeActorsToday = jpaRepository.countDistinctActorsSince(startOfToday);
        String topAction = jpaRepository.findTopActionLabelsSince(startOfToday).stream().findFirst().orElse(null);
        AuditLogJpaEntity last = jpaRepository.findTopByOrderByCreatedAtDesc();
        long total = jpaRepository.count();
        return new AuditSummary(actionsToday, activeActorsToday, topAction, last != null ? toDomain(last) : null, total);
    }

    @Override
    public List<ActorOption> listDistinctActors() {
        return jpaRepository.findDistinctActors().stream().map(p -> new ActorOption(p.getSicil(), p.getName())).toList();
    }

    @Override
    public List<ActionOption> listDistinctActions() {
        return jpaRepository.findDistinctActions().stream().map(p -> new ActionOption(p.getCode(), p.getLabel())).toList();
    }

    private AuditLogJpaEntity toEntity(AuditLog log) {
        AuditLogJpaEntity entity = new AuditLogJpaEntity();
        entity.setActorSicil(log.getActorSicil());
        entity.setActorName(log.getActorName());
        entity.setActorRole(log.getActorRole());
        entity.setHttpMethod(log.getHttpMethod());
        entity.setActionCode(log.getActionCode());
        entity.setActionLabel(log.getActionLabel());
        entity.setEntityType(log.getEntityType());
        entity.setEntityId(log.getEntityId());
        entity.setTeamId(log.getTeamId());
        entity.setStatusCode(log.getStatusCode());
        entity.setSuccess(log.isSuccess());
        return entity;
    }

    private AuditLog toDomain(AuditLogJpaEntity entity) {
        return new AuditLog(entity.getId(), entity.getActorSicil(), entity.getActorName(), entity.getActorRole(),
                entity.getHttpMethod(), entity.getActionCode(), entity.getActionLabel(), entity.getEntityType(),
                entity.getEntityId(), entity.getTeamId(), entity.getStatusCode(), entity.isSuccess(), entity.getCreatedAt());
    }
}
