package com.aksa.capacityplanner.capacity.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Kapasite dashboard ekraninda gosterilen 14 gostergeyi tasiyan sonuc modeli.
 * Bu nesne kalici degildir, CapacityCalculationService tarafindan istek anlik hesaplanir.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapacityDashboard {

    private Long teamId;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private LocalDate reportDate;

    // 1-3
    private BigDecimal totalPlannedEffort;
    private BigDecimal completedEffort;
    private BigDecimal remainingEffort;

    // 4-6
    private BigDecimal remainingCapacity;
    private BigDecimal maintainedOccupancyPercent;
    private BigDecimal capacityGap;

    // 7-9
    private BigDecimal periodClosedEffort;
    private BigDecimal newlyAddedEffort;
    private BigDecimal netChange;

    private RiskLevel overallRiskLevel;

    // 10-14
    private List<MemberCapacityMetrics> memberMetrics;
}
