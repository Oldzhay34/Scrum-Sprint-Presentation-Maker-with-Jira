package com.aksa.capacityplanner.leave.api.dto;

import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.domain.LeaveType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeavePeriodDto(Long id, String name, LeaveType type, LeaveScope scope, Long teamMemberId,
                              LocalDate startDate, LocalDate endDate, BigDecimal dayFraction, String description) {
}
