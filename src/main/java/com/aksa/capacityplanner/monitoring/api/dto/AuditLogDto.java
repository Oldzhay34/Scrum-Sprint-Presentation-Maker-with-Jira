package com.aksa.capacityplanner.monitoring.api.dto;

import com.aksa.capacityplanner.monitoring.domain.AuditLog;

import java.time.Instant;

public record AuditLogDto(Long id, String actorSicil, String actorName, String actorRole, String httpMethod,
                           String actionCode, String actionLabel, String entityType, String entityId,
                           Long teamId, String teamName, int statusCode, boolean success, Instant createdAt) {

    public static AuditLogDto from(AuditLog log, String teamName) {
        return new AuditLogDto(log.getId(), log.getActorSicil(), log.getActorName(), log.getActorRole(),
                log.getHttpMethod(), log.getActionCode(), log.getActionLabel(), log.getEntityType(), log.getEntityId(),
                log.getTeamId(), teamName, log.getStatusCode(), log.isSuccess(), log.getCreatedAt());
    }
}
