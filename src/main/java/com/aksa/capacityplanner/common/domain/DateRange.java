package com.aksa.capacityplanner.common.domain;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;

public record DateRange(LocalDate start, LocalDate end) {

    public DateRange {
        if (start == null || end == null) {
            throw new IllegalArgumentException("start ve end zorunludur");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("end, start'tan once olamaz");
        }
    }

    public boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    public DateRange intersect(DateRange other) {
        LocalDate newStart = start.isAfter(other.start) ? start : other.start;
        LocalDate newEnd = end.isBefore(other.end) ? end : other.end;
        if (newEnd.isBefore(newStart)) {
            return null;
        }
        return new DateRange(newStart, newEnd);
    }

    /**
     * Hafta sonlari ve verilen tatil gunleri haric is gunu sayisini hesaplar.
     * holidayDayFractions: tatil tarihi -> o gun dusulecek kesir (1 = tam gun, 0.5 = yarim gun).
     */
    public BigDecimal businessDays(Set<LocalDate> fullHolidays, Set<LocalDate> halfDayHolidays) {
        BigDecimal total = BigDecimal.ZERO;
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                continue;
            }
            if (fullHolidays != null && fullHolidays.contains(date)) {
                continue;
            }
            if (halfDayHolidays != null && halfDayHolidays.contains(date)) {
                total = total.add(BigDecimal.valueOf(0.5));
            } else {
                total = total.add(BigDecimal.ONE);
            }
        }
        return total;
    }
}
