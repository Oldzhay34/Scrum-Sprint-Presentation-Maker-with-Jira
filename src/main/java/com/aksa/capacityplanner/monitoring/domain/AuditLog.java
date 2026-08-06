package com.aksa.capacityplanner.monitoring.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Insert-only aktivite kaydi - bkz. V10__audit_log.sql (DB trigger UPDATE/DELETE'i engeller). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    private Long id;
    private String actorSicil;
    private String actorName;
    private String actorRole;
    private String httpMethod;
    private String actionCode;
    private String actionLabel;
    private String entityType;
    private String entityId;
    private Long teamId;
    private int statusCode;
    private boolean success;
    private Instant createdAt;
}
