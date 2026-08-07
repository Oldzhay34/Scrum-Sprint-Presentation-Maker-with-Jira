package com.aksa.capacityplanner.presentation.api.dto;

import java.time.Instant;

public record PresentationSummaryDto(Long id, Long teamId, String sprintNo, String dateRange,
                                      int currentVersion, String updatedBy, Instant updatedAt) {
}
