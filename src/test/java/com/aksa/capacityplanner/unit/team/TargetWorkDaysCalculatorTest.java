package com.aksa.capacityplanner.unit.team;

import com.aksa.capacityplanner.team.domain.TargetWorkDaysCalculator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class TargetWorkDaysCalculatorTest {

    @Test
    void startDateBeforeJune1_defaultsTo145() {
        BigDecimal result = TargetWorkDaysCalculator.calculateDefault(
                LocalDate.of(2026, 3, 1), 2026, Set.of(), Set.of());

        assertThat(result).isEqualByComparingTo("145");
    }

    @Test
    void startDateExactlyJune1_defaultsTo145() {
        BigDecimal result = TargetWorkDaysCalculator.calculateDefault(
                LocalDate.of(2026, 6, 1), 2026, Set.of(), Set.of());

        assertThat(result).isEqualByComparingTo("145");
    }

    @Test
    void startDateAfterJune1_isProratedByBusinessDays() {
        // 2026-12-01 (Sali) - 2026-12-31 (Persembe) araligindaki is gunlerine esit olmali
        BigDecimal result = TargetWorkDaysCalculator.calculateDefault(
                LocalDate.of(2026, 12, 1), 2026, Set.of(), Set.of());

        assertThat(result).isLessThan(new BigDecimal("145"));
        assertThat(result).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    void startDateAfterPeriodEnd_returnsZero() {
        BigDecimal result = TargetWorkDaysCalculator.calculateDefault(
                LocalDate.of(2027, 1, 15), 2026, Set.of(), Set.of());

        assertThat(result).isEqualByComparingTo("0");
    }

    @Test
    void nullStartDate_defaultsTo145() {
        BigDecimal result = TargetWorkDaysCalculator.calculateDefault(null, 2026, Set.of(), Set.of());

        assertThat(result).isEqualByComparingTo("145");
    }
}
