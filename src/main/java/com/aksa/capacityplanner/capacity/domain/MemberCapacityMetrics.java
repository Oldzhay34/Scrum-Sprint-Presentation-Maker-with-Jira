package com.aksa.capacityplanner.capacity.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberCapacityMetrics {

    private Long teamMemberId;
    private String fullName;
    private String role;
    private BigDecimal totalPlannedEffort;
    private BigDecimal completedEffort;
    private BigDecimal remainingEffort;
    /** Bakim/SR ayrimindan once, izinler dusulmus ham kalan kapasite. */
    private BigDecimal rawRemainingCapacity;
    /** Bakim/SR sonrasi kullanilabilir kapasite (Kapasite AG kolonu). */
    private BigDecimal maintainedCapacity;
    private BigDecimal occupancyPercent;
    private RiskLevel riskLevel;
}
