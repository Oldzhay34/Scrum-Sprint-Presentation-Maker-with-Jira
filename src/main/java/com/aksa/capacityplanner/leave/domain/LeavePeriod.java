package com.aksa.capacityplanner.leave.domain;

import com.aksa.capacityplanner.common.domain.DateRange;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tek bir izin/tatil blogu. startDate-endDate arasindaki her gune dayFraction
 * (1 = tam gun, 0.5 = yarim gun) uygulanir. Farkli fraksiyonlar iceren donemler
 * (orn. 1,5 gunluk arife + tam gun) ayri kayitlar olarak girilir.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeavePeriod {

    private Long id;
    private String name;
    private LeaveType type;
    private LeaveScope scope;
    /** scope=TEAM_MEMBER ise doludur. */
    private Long teamMemberId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal dayFraction;
    private String description;

    public DateRange toDateRange() {
        return new DateRange(startDate, endDate);
    }
}
