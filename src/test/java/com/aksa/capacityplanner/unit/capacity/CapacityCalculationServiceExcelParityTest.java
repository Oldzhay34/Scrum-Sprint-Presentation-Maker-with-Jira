package com.aksa.capacityplanner.unit.capacity;

import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService;
import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService.CapacityCalculationInput;
import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;
import com.aksa.capacityplanner.capacity.domain.MemberCapacityMetrics;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.domain.TeamMember;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RPA_Kapasite_Takipv2.xlsx dosyasindaki "Kapasite" sayfasinin gercek degerlerine
 * karsi regresyon testi. Rapor tarihi 13.07.2026, donem 01.06-31.12.2026, bakim
 * orani 0.2. Excel'deki degerler:
 *   Anil:   hedef=145, izin=0, gecen=31, kalan=114, bakimHarici=91.2
 *   Burak:  hedef=145, izin=4, gecen=31, kalan=110, bakimHarici=88.0
 *   Sevket: hedef=132 (18.06.2026 baslangicli, manuel), izin=0, gecen=18, kalan=114, bakimHarici=91.2
 */
class CapacityCalculationServiceExcelParityTest {

    private final CapacityCalculationService service = new CapacityCalculationService();

    private static final LocalDate PERIOD_START = LocalDate.of(2026, 6, 1);
    private static final LocalDate PERIOD_END = LocalDate.of(2026, 12, 31);
    private static final LocalDate REPORT_DATE = LocalDate.of(2026, 7, 13);
    private static final BigDecimal MAINTENANCE = new BigDecimal("0.2");

    private final List<StatusOption> statuses = List.of(
            new StatusOption(1L, null, "OPEN", "Acik", false, null, 0));

    @Test
    void anil_matchesExcelExactly() {
        MemberCapacityMetrics m = calculate(member(1L, "Anil", LocalDate.of(2026, 1, 1), new BigDecimal("145")), BigDecimal.ZERO);
        assertThat(m.getRawRemainingCapacity()).isEqualByComparingTo("114");
        assertThat(m.getMaintainedCapacity()).isEqualByComparingTo("91.20");
    }

    @Test
    void burak_withTwoLeaveDays_matchesExcelExactly() {
        MemberCapacityMetrics m = calculate(member(2L, "Burak", LocalDate.of(2026, 1, 1), new BigDecimal("145")), new BigDecimal("4"));
        assertThat(m.getRawRemainingCapacity()).isEqualByComparingTo("110");
        assertThat(m.getMaintainedCapacity()).isEqualByComparingTo("88.00");
    }

    @Test
    void sevket_startingMidPeriod_matchesExcelExactly() {
        MemberCapacityMetrics m = calculate(member(3L, "Sevket", LocalDate.of(2026, 6, 18), new BigDecimal("132")), BigDecimal.ZERO);
        assertThat(m.getRawRemainingCapacity()).isEqualByComparingTo("114");
        assertThat(m.getMaintainedCapacity()).isEqualByComparingTo("91.20");
    }

    private MemberCapacityMetrics calculate(TeamMember member, BigDecimal leaveDays) {
        CapacityDashboard dashboard = service.calculate(new CapacityCalculationInput(
                1L, PERIOD_START, PERIOD_END, REPORT_DATE, null,
                MAINTENANCE, List.of(), List.of(member), statuses,
                Map.of(member.getId(), leaveDays), Map.of(), Set.of(), Set.of()));
        return dashboard.getMemberMetrics().get(0);
    }

    private TeamMember member(Long id, String name, LocalDate startDate, BigDecimal targetWorkDays) {
        return new TeamMember(id, 1L, name, "RPA Gelistirici", null, startDate, "OPEN", targetWorkDays, true);
    }
}
