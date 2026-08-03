package com.aksa.capacityplanner.unit.capacity;

import com.aksa.capacityplanner.capacity.domain.*;
import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService.CapacityCalculationInput;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.domain.TeamMember;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CapacityCalculationServiceTest {

    private final CapacityCalculationService service = new CapacityCalculationService();

    private static final LocalDate PERIOD_START = LocalDate.of(2026, 6, 1);
    private static final LocalDate PERIOD_END = LocalDate.of(2026, 12, 31);

    private final List<StatusOption> statuses = List.of(
            new StatusOption(1L, null, "OPEN", "Acik", false, null, 0),
            new StatusOption(2L, null, "DONE", "Tamamlandi", true, null, 1));

    @Test
    void singleMember_normalOccupancy_isNotAtRisk() {
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        WorkItem open = workItem(1L, member.getId(), new BigDecimal("10"), "OPEN", null);
        WorkItem done = workItem(2L, member.getId(), new BigDecimal("5"), "DONE", LocalDate.of(2026, 6, 10));

        CapacityDashboard dashboard = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 1), null,
                BigDecimal.ZERO, List.of(open, done), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));

        assertThat(dashboard.getTotalPlannedEffort()).isEqualByComparingTo("15");
        assertThat(dashboard.getCompletedEffort()).isEqualByComparingTo("5");
        assertThat(dashboard.getRemainingEffort()).isEqualByComparingTo("10");
        assertThat(dashboard.getMemberMetrics()).hasSize(1);
        assertThat(dashboard.getMemberMetrics().get(0).getRiskLevel()).isEqualTo(RiskLevel.UYGUN);
    }

    @Test
    void occupancyAbove120Percent_isHighRisk() {
        // 1 Aralik - 31 Aralik: yaklasik 23 is gunu kapasite (bakim orani 0). Kalan efor bunun cok
        // uzerinde olacak sekilde ayarlaniyor ki doluluk %120'yi assin.
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        WorkItem heavy = workItem(1L, member.getId(), new BigDecimal("500"), "OPEN", null);

        CapacityDashboard dashboard = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 12, 1), null,
                BigDecimal.ZERO, List.of(heavy), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));

        assertThat(dashboard.getMemberMetrics().get(0).getRiskLevel()).isEqualTo(RiskLevel.YUKSEK_RISK);
        assertThat(dashboard.getOverallRiskLevel()).isEqualTo(RiskLevel.YUKSEK_RISK);
        assertThat(dashboard.getCapacityGap()).isLessThan(BigDecimal.ZERO);
    }

    @Test
    void maintenanceAllocation_reducesUsableCapacity() {
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        WorkItem item = workItem(1L, member.getId(), new BigDecimal("10"), "OPEN", null);

        CapacityDashboard withoutMaintenance = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 1), null,
                BigDecimal.ZERO, List.of(item), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));
        CapacityDashboard withMaintenance = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 1), null,
                new BigDecimal("0.20"), List.of(item), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));

        assertThat(withMaintenance.getMemberMetrics().get(0).getMaintainedCapacity())
                .isLessThan(withoutMaintenance.getMemberMetrics().get(0).getMaintainedCapacity());
    }

    @Test
    void approvedLeaveDays_reduceRemainingCapacity() {
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        WorkItem item = workItem(1L, member.getId(), new BigDecimal("10"), "OPEN", null);

        CapacityDashboard noLeave = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 1), null,
                BigDecimal.ZERO, List.of(item), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));
        CapacityDashboard withLeave = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 1), null,
                BigDecimal.ZERO, List.of(item), List.of(member), statuses,
                Map.of(1L, new BigDecimal("10")), Set.of(), Set.of()));

        assertThat(withLeave.getRemainingCapacity()).isLessThan(noLeave.getRemainingCapacity());
    }

    @Test
    void zeroCapacity_doesNotThrowAndYieldsZeroOccupancy() {
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        // Rapor tarihi donem sonundan sonra -> ham kapasite 0
        CapacityDashboard dashboard = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2027, 1, 1), null,
                BigDecimal.ZERO, List.of(), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));

        assertThat(dashboard.getMemberMetrics().get(0).getOccupancyPercent()).isEqualByComparingTo("0");
    }

    @Test
    void periodClosedAndNewlyAddedEffort_areComputedFromSnapshotWindow() {
        TeamMember member = member(1L, LocalDate.of(2026, 1, 1));
        WorkItem closedRecently = workItem(1L, member.getId(), new BigDecimal("8"), "DONE", LocalDate.of(2026, 6, 15));
        WorkItem addedRecently = new WorkItem(2L, 1L, member.getId(), "Yeni is", null,
                new BigDecimal("6"), "OPEN", WorkItemSource.MANUAL, LocalDate.of(2026, 6, 16), null);

        CapacityDashboard dashboard = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, LocalDate.of(2026, 6, 20),
                LocalDate.of(2026, 6, 10),
                BigDecimal.ZERO, List.of(closedRecently, addedRecently), List.of(member), statuses,
                Map.of(), Set.of(), Set.of()));

        assertThat(dashboard.getPeriodClosedEffort()).isEqualByComparingTo("8");
        assertThat(dashboard.getNewlyAddedEffort()).isEqualByComparingTo("6");
        assertThat(dashboard.getNetChange()).isEqualByComparingTo("-2");
    }

    private TeamMember member(Long id, LocalDate startDate) {
        return new TeamMember(id, 1L, "Test Kisi", "Gelistirici", "test@aksa.com",
                startDate, "OPEN", new BigDecimal("145"), false);
    }

    private WorkItem workItem(Long id, Long memberId, BigDecimal effort, String statusCode, LocalDate closedDate) {
        return new WorkItem(id, 1L, memberId, "Is " + id, null, effort, statusCode,
                WorkItemSource.MANUAL, LocalDate.of(2026, 1, 1), closedDate);
    }
}
