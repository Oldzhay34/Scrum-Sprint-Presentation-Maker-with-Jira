package com.aksa.capacityplanner.leave.port.in;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface LeaveUseCase {
    LeavePeriod createLeavePeriod(LeavePeriod period);

    LeavePeriod updateLeavePeriod(Long id, LeavePeriod period);

    void deleteLeavePeriod(Long id);

    List<LeavePeriod> listCompanyWideLeaves();

    List<LeavePeriod> listLeavesForMember(Long teamMemberId);

    /** Verilen tarih araligindaki, belirli bir kisiye ait onayli izin gun sayisi (sirket tatilleri haric, sadece kisisel izin). */
    BigDecimal calculateApprovedLeaveDays(Long teamMemberId, LocalDate from, LocalDate to);
}
