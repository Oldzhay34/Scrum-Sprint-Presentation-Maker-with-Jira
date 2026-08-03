package com.aksa.capacityplanner.team.domain;

import com.aksa.capacityplanner.common.domain.DateRange;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.Set;

/**
 * Kisinin ise baslangic tarihine gore 1 Haziran - 31 Aralik donemi icin
 * varsayilan hedef is gunu sayisini hesaplar.
 *
 * Kural: startDate 1 Haziran'dan once (veya ayni gun) ise varsayilan 145 gun.
 * startDate 1 Haziran'dan sonraysa, startDate ile 31 Aralik arasindaki
 * (hafta sonu ve resmi tatil/sirket tatili haric) is gunu sayisi kullanilir.
 * Sonuc her zaman kullanici tarafindan override edilebilir.
 */
public class TargetWorkDaysCalculator {

    public static final BigDecimal DEFAULT_FULL_PERIOD_TARGET_DAYS = BigDecimal.valueOf(145);

    private TargetWorkDaysCalculator() {
    }

    public static BigDecimal calculateDefault(LocalDate startDate, int periodYear,
                                               Set<LocalDate> fullHolidays, Set<LocalDate> halfDayHolidays) {
        LocalDate periodStart = LocalDate.of(periodYear, Month.JUNE, 1);
        LocalDate periodEnd = LocalDate.of(periodYear, Month.DECEMBER, 31);

        if (startDate == null || !startDate.isAfter(periodStart)) {
            return DEFAULT_FULL_PERIOD_TARGET_DAYS;
        }
        if (startDate.isAfter(periodEnd)) {
            return BigDecimal.ZERO;
        }
        DateRange proratedRange = new DateRange(startDate, periodEnd);
        return proratedRange.businessDays(fullHolidays, halfDayHolidays);
    }
}
