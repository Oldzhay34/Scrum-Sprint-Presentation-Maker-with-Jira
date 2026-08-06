package com.aksa.capacityplanner.monitoring.api.dto;

public record AuditSummaryDto(long actionsToday, long activeActorsToday, String topActionLabelToday,
                               AuditLogDto lastAction, long totalActions) {
}
