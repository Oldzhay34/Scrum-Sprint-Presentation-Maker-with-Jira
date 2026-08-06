package com.aksa.capacityplanner.monitoring.domain;

import java.util.List;

public record AuditLogPage(List<AuditLog> content, int page, int size, long totalElements, int totalPages) {
}
