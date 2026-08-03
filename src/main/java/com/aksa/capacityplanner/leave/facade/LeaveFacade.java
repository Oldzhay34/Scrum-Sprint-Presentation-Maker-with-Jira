package com.aksa.capacityplanner.leave.facade;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.port.in.LeaveUseCase;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class LeaveFacade {

    private final LeaveUseCase leaveUseCase;

    public LeaveFacade(LeaveUseCase leaveUseCase) {
        this.leaveUseCase = leaveUseCase;
    }

    public LeavePeriod createLeavePeriod(LeavePeriod period) {
        return leaveUseCase.createLeavePeriod(period);
    }

    public LeavePeriod updateLeavePeriod(Long id, LeavePeriod period) {
        return leaveUseCase.updateLeavePeriod(id, period);
    }

    public void deleteLeavePeriod(Long id) {
        leaveUseCase.deleteLeavePeriod(id);
    }

    public List<LeavePeriod> listCompanyWideLeaves() {
        return leaveUseCase.listCompanyWideLeaves();
    }

    public List<LeavePeriod> listLeavesForMember(Long teamMemberId) {
        return leaveUseCase.listLeavesForMember(teamMemberId);
    }

    public BigDecimal calculateApprovedLeaveDays(Long teamMemberId, LocalDate from, LocalDate to) {
        return leaveUseCase.calculateApprovedLeaveDays(teamMemberId, from, to);
    }
}
