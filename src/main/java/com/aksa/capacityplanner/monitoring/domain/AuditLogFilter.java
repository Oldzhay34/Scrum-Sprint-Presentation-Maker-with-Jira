package com.aksa.capacityplanner.monitoring.domain;

import java.time.Instant;

/** Aktivite loglari listesi icin opsiyonel filtreler - hepsi null olabilir (filtresiz). */
public record AuditLogFilter(String actorSicil, String actionCode, String entityType, Long teamId,
                              Boolean success, Instant from, Instant to) {
}
