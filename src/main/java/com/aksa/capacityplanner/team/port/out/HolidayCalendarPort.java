package com.aksa.capacityplanner.team.port.out;

import java.time.LocalDate;
import java.util.Set;

/**
 * Team modulunun hedef is gunu hesabi icin ihtiyac duydugu tatil takvimi.
 * Gercek implementasyon leave modulunde saglanir (leave.adapter.out.HolidayCalendarAdapter),
 * boylece team modulu leave modulunun ic yapisina bagli olmaz.
 */
public interface HolidayCalendarPort {
    Set<LocalDate> getFullDayHolidays(int year);

    Set<LocalDate> getHalfDayHolidays(int year);
}
