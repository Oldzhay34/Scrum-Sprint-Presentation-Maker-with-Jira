package com.aksa.capacityplanner.capacity.api.dto;

import com.aksa.capacityplanner.capacity.domain.RiskLevel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CapacityDashboardDto(Long teamId, LocalDate periodStart, LocalDate periodEnd, LocalDate reportDate,
                                    BigDecimal totalPlannedEffort, BigDecimal completedEffort, BigDecimal remainingEffort,
                                    BigDecimal remainingCapacity, BigDecimal maintainedOccupancyPercent, BigDecimal capacityGap,
                                    BigDecimal periodClosedEffort, BigDecimal newlyAddedEffort, BigDecimal netChange,
                                    RiskLevel overallRiskLevel, List<MemberCapacityMetricsDto> memberMetrics,
                                    String activeSprintName, LocalDate activeSprintStartDate, LocalDate activeSprintEndDate) {
}
