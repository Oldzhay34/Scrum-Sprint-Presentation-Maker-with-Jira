package com.aksa.capacityplanner.capacity.domain;

import com.aksa.capacityplanner.common.domain.DateRange;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.domain.TeamMember;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Kapasite dashboard'un 14 gostergesini hesaplayan saf domain servisi.
 * Framework'e bagimsizdir; girdileri usecase katmani hazirlar.
 */
public class CapacityCalculationService {

    private static final int SCALE = 2;

    public CapacityDashboard calculate(CapacityCalculationInput input) {
        Map<String, StatusOption> statusByCode = input.statusOptions().stream()
                .collect(java.util.stream.Collectors.toMap(StatusOption::getCode, Function.identity(), (a, b) -> a));

        BigDecimal totalPlanned = sumEffort(input.workItems(), wi -> true);
        BigDecimal completed = sumEffort(input.workItems(), wi -> isCompleted(wi, statusByCode));
        BigDecimal remaining = totalPlanned.subtract(completed);

        BigDecimal periodClosed = input.previousSnapshotDate() == null ? BigDecimal.ZERO
                : sumEffort(input.workItems(), wi -> wi.getClosedDate() != null
                        && !wi.getClosedDate().isBefore(input.previousSnapshotDate())
                        && !wi.getClosedDate().isAfter(input.reportDate()));

        BigDecimal newlyAdded = input.previousSnapshotDate() == null ? BigDecimal.ZERO
                : sumEffort(input.workItems(), wi -> wi.getAddedDate() != null
                        && !wi.getAddedDate().isBefore(input.previousSnapshotDate())
                        && !wi.getAddedDate().isAfter(input.reportDate()));

        BigDecimal netChange = periodClosed.subtract(newlyAdded);

        BigDecimal teamMaintenancePercent = input.maintenanceAllocationPercent() == null
                ? BigDecimal.ZERO : input.maintenanceAllocationPercent();

        List<MemberCapacityMetrics> memberMetrics = input.teamMembers().stream()
                .map(member -> calculateMemberMetrics(member, input, statusByCode, teamMaintenancePercent))
                .toList();

        BigDecimal remainingCapacity = memberMetrics.stream()
                .map(MemberCapacityMetrics::getRawRemainingCapacity)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maintainedCapacity = memberMetrics.stream()
                .map(MemberCapacityMetrics::getMaintainedCapacity)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal occupancyPercent = percentOf(remaining, maintainedCapacity);
        BigDecimal capacityGap = maintainedCapacity.subtract(remaining).setScale(SCALE, RoundingMode.HALF_UP);

        CapacityDashboard dashboard = new CapacityDashboard();
        dashboard.setTeamId(input.teamId());
        dashboard.setPeriodStart(input.periodStart());
        dashboard.setPeriodEnd(input.periodEnd());
        dashboard.setReportDate(input.reportDate());
        dashboard.setTotalPlannedEffort(scale(totalPlanned));
        dashboard.setCompletedEffort(scale(completed));
        dashboard.setRemainingEffort(scale(remaining));
        dashboard.setRemainingCapacity(scale(remainingCapacity));
        dashboard.setMaintainedOccupancyPercent(occupancyPercent);
        dashboard.setCapacityGap(capacityGap);
        dashboard.setPeriodClosedEffort(scale(periodClosed));
        dashboard.setNewlyAddedEffort(scale(newlyAdded));
        dashboard.setNetChange(scale(netChange));
        dashboard.setOverallRiskLevel(riskLevelOf(occupancyPercent));
        dashboard.setMemberMetrics(memberMetrics);
        return dashboard;
    }

    private MemberCapacityMetrics calculateMemberMetrics(TeamMember member, CapacityCalculationInput input,
                                                           Map<String, StatusOption> statusByCode,
                                                           BigDecimal teamMaintenancePercent) {
        // Kisi bazli bakim/SR orani, tanimliysa takim seviyesindeki oranin yerine gecer
        // (orn. bir kisi baska bir kisiden daha fazla/az bakim isine ayriliyor olabilir).
        BigDecimal effectiveMaintenancePercent = input.maintenanceOverridesByMember() == null ? null
                : input.maintenanceOverridesByMember().get(member.getId());
        if (effectiveMaintenancePercent == null) {
            effectiveMaintenancePercent = teamMaintenancePercent;
        }
        BigDecimal maintenanceFactor = BigDecimal.ONE.subtract(effectiveMaintenancePercent);

        BigDecimal planned = sumEffort(input.workItems(),
                wi -> member.getId().equals(wi.getTeamMemberId()));
        BigDecimal completed = sumEffort(input.workItems(),
                wi -> member.getId().equals(wi.getTeamMemberId()) && isCompleted(wi, statusByCode));
        BigDecimal remaining = planned.subtract(completed);

        // RPA_Kapasite_Takip Excel'indeki "Kapasite" sayfasi ile birebir ayni yontem:
        // Kalan Is Gunu = Hedef Is Gunu - Izin - Gecen Is Gunu (baslangictan rapor tarihine kadar NETWORKDAYS).
        // Not: NETWORKDAYS(raporTarihi, donemSonu) gibi ILERI yonlu bir hesap KULLANILMAZ -
        // bu, Excel'deki gecen-gun bazli yontemden 1 gunluk sapmaya yol acar (dogrulandi).
        // Excel'deki "Kapasite Başlangıç" kolonu, donem oncesi baslayan kisiler icin
        // donem baslangicina sabitlenir (yalnizca donem icinde baslayanlar icin gercek
        // baslangic tarihi kullanilir) - bkz. TargetWorkDaysCalculator ile ayni varsayim.
        LocalDate memberStart = member.getStartDate() != null && member.getStartDate().isAfter(input.periodStart())
                ? member.getStartDate() : input.periodStart();
        BigDecimal elapsed = BigDecimal.ZERO;
        if (!input.reportDate().isBefore(memberStart)) {
            LocalDate elapsedEnd = input.reportDate().isBefore(input.periodEnd()) ? input.reportDate() : input.periodEnd();
            if (!elapsedEnd.isBefore(memberStart)) {
                elapsed = new DateRange(memberStart, elapsedEnd).businessDays(input.fullHolidays(), input.halfDayHolidays());
            }
        }
        BigDecimal targetWorkDays = member.getTargetWorkDays() != null ? member.getTargetWorkDays() : BigDecimal.ZERO;
        BigDecimal approvedLeaveDays = input.approvedLeaveDaysByMember()
                .getOrDefault(member.getId(), BigDecimal.ZERO);
        BigDecimal netCapacity = targetWorkDays.subtract(elapsed).subtract(approvedLeaveDays).max(BigDecimal.ZERO);
        BigDecimal maintainedCapacity = netCapacity.multiply(maintenanceFactor).setScale(SCALE, RoundingMode.HALF_UP);

        BigDecimal occupancyPercent = percentOf(remaining, maintainedCapacity);

        MemberCapacityMetrics metrics = new MemberCapacityMetrics();
        metrics.setTeamMemberId(member.getId());
        metrics.setFullName(member.getFullName());
        metrics.setRole(member.getRole());
        metrics.setAvatarUrl(member.getAvatarUrl());
        metrics.setTotalPlannedEffort(scale(planned));
        metrics.setCompletedEffort(scale(completed));
        metrics.setRemainingEffort(scale(remaining));
        metrics.setRawRemainingCapacity(scale(netCapacity));
        metrics.setMaintainedCapacity(maintainedCapacity);
        metrics.setMaintenanceAllocationPercent(effectiveMaintenancePercent);
        metrics.setOccupancyPercent(occupancyPercent);
        metrics.setRiskLevel(riskLevelOf(occupancyPercent));
        return metrics;
    }

    private boolean isCompleted(WorkItem workItem, Map<String, StatusOption> statusByCode) {
        StatusOption status = statusByCode.get(workItem.getStatusCode());
        return status != null && status.isCountsAsCompleted();
    }

    private BigDecimal sumEffort(List<WorkItem> items, java.util.function.Predicate<WorkItem> filter) {
        return items.stream()
                .filter(filter)
                .map(WorkItem::getPlannedEffortDays)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal percentOf(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return numerator.multiply(BigDecimal.valueOf(100))
                .divide(denominator, SCALE, RoundingMode.HALF_UP);
    }

    /**
     * RPA_Kapasite_Takip Excel'indeki "Durum" formulu ile birebir ayni esikler:
     * IF(doluluk&gt;=1.2,"Yuksek Risk", IF(doluluk&gt;=1.0,"Risk", IF(doluluk&gt;=0.85,"Dikkat","Uygun")))
     */
    private RiskLevel riskLevelOf(BigDecimal occupancyPercent) {
        if (occupancyPercent.compareTo(BigDecimal.valueOf(120)) >= 0) {
            return RiskLevel.YUKSEK_RISK;
        }
        if (occupancyPercent.compareTo(BigDecimal.valueOf(100)) >= 0) {
            return RiskLevel.RISK;
        }
        if (occupancyPercent.compareTo(BigDecimal.valueOf(85)) >= 0) {
            return RiskLevel.DIKKAT;
        }
        return RiskLevel.UYGUN;
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public record CapacityCalculationInput(
            Long teamId,
            LocalDate periodStart,
            LocalDate periodEnd,
            LocalDate reportDate,
            LocalDate previousSnapshotDate,
            BigDecimal maintenanceAllocationPercent,
            List<WorkItem> workItems,
            List<TeamMember> teamMembers,
            List<StatusOption> statusOptions,
            Map<Long, BigDecimal> approvedLeaveDaysByMember,
            Map<Long, BigDecimal> maintenanceOverridesByMember,
            Set<LocalDate> fullHolidays,
            Set<LocalDate> halfDayHolidays) {
    }
}
