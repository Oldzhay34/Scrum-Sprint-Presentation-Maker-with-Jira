package com.aksa.capacityplanner.leave.adapter.out;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.port.out.LeavePeriodRepositoryPort;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.HashSet;
import java.util.Set;

/**
 * Team modulunun HolidayCalendarPort'unu, leave modulundeki sirket-genelindeki
 * (RESMI_TATIL / SIRKET_TATILI) izin donemlerini kullanarak karsilar.
 */
@Component
public class HolidayCalendarAdapter implements HolidayCalendarPort {

    private final LeavePeriodRepositoryPort leavePeriodRepository;

    public HolidayCalendarAdapter(LeavePeriodRepositoryPort leavePeriodRepository) {
        this.leavePeriodRepository = leavePeriodRepository;
    }

    @Override
    public Set<LocalDate> getFullDayHolidays(int year) {
        return collect(year, BigDecimal.ONE);
    }

    @Override
    public Set<LocalDate> getHalfDayHolidays(int year) {
        return collect(year, BigDecimal.valueOf(0.5));
    }

    private Set<LocalDate> collect(int year, BigDecimal fraction) {
        LocalDate from = LocalDate.of(year, Month.JANUARY, 1);
        LocalDate to = LocalDate.of(year, Month.DECEMBER, 31);
        Set<LocalDate> result = new HashSet<>();
        for (LeavePeriod period : leavePeriodRepository.findCompanyWideBetween(from, to)) {
            if (period.getDayFraction() == null || period.getDayFraction().compareTo(fraction) != 0) {
                continue;
            }
            for (LocalDate d = period.getStartDate(); !d.isAfter(period.getEndDate()); d = d.plusDays(1)) {
                if (!d.isBefore(from) && !d.isAfter(to)) {
                    result.add(d);
                }
            }
        }
        return result;
    }
}
