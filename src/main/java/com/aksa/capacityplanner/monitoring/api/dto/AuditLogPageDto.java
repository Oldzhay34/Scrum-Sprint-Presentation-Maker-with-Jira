package com.aksa.capacityplanner.monitoring.api.dto;

import java.util.List;

public record AuditLogPageDto(List<AuditLogDto> content, int page, int size, long totalElements, int totalPages) {
}
