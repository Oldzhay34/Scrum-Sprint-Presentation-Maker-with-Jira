package com.aksa.capacityplanner.monitoring.domain;

import java.time.Instant;

/** Monitoring sayfasi ust bilgi seridi (KPI) icin ozet veriler. */
public record AuditSummary(long actionsToday, long activeActorsToday, String topActionLabelToday,
                            AuditLog lastAction, long totalActions) {
    public static AuditSummary empty() {
        return new AuditSummary(0, 0, null, null, 0);
    }
}
