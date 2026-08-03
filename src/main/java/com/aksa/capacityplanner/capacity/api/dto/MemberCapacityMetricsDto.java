package com.aksa.capacityplanner.capacity.api.dto;

import com.aksa.capacityplanner.capacity.domain.RiskLevel;

import java.math.BigDecimal;

public record MemberCapacityMetricsDto(Long teamMemberId, String fullName, String role,
                                        BigDecimal totalPlannedEffort, BigDecimal completedEffort,
                                        BigDecimal remainingEffort, BigDecimal rawRemainingCapacity,
                                        BigDecimal maintainedCapacity, BigDecimal occupancyPercent,
                                        RiskLevel riskLevel) {
}
