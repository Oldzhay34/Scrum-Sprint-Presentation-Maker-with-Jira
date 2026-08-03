package com.aksa.capacityplanner.capacity.api.dto;

import com.aksa.capacityplanner.capacity.domain.WorkItemSource;

import java.math.BigDecimal;
import java.time.LocalDate;

public record WorkItemDto(Long id, Long teamId, Long teamMemberId, String title, String jiraIssueKey,
                           BigDecimal plannedEffortDays, String statusCode, WorkItemSource source,
                           LocalDate addedDate, LocalDate closedDate) {
}
