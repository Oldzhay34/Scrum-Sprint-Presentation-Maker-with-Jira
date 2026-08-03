package com.aksa.capacityplanner.unit.common;

import com.aksa.capacityplanner.common.domain.DateRange;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DateRangeTest {

    @Test
    void endBeforeStart_throws() {
        assertThatThrownBy(() -> new DateRange(LocalDate.of(2026, 6, 10), LocalDate.of(2026, 6, 1)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void businessDays_excludesWeekends() {
        // 2026-06-01 Pazartesi - 2026-06-07 Pazar (1 hafta) -> 5 is gunu
        DateRange range = new DateRange(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 7));

        BigDecimal result = range.businessDays(Set.of(), Set.of());

        assertThat(result).isEqualByComparingTo("5");
    }

    @Test
    void businessDays_excludesFullHolidaysAndHalvesHalfDayHolidays() {
        // 2026-06-01 (Pzt) .. 2026-06-05 (Cuma) = 5 is gunu
        // 06-03 tam tatil (-1), 06-04 yarim tatil (-0.5) -> 3.5 gun kalir
        DateRange range = new DateRange(LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 5));

        BigDecimal result = range.businessDays(
                Set.of(LocalDate.of(2026, 6, 3)),
                Set.of(LocalDate.of(2026, 6, 4)));

        assertThat(result).isEqualByComparingTo("3.5");
    }

    @Test
    void intersect_returnsNullWhenNoOverlap() {
        DateRange a = new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10));
        DateRange b = new DateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 10));

        assertThat(a.intersect(b)).isNull();
    }

    @Test
    void intersect_returnsOverlappingRange() {
        DateRange a = new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 20));
        DateRange b = new DateRange(LocalDate.of(2026, 1, 10), LocalDate.of(2026, 1, 30));

        DateRange overlap = a.intersect(b);

        assertThat(overlap).isNotNull();
        assertThat(overlap.start()).isEqualTo(LocalDate.of(2026, 1, 10));
        assertThat(overlap.end()).isEqualTo(LocalDate.of(2026, 1, 20));
    }
}
