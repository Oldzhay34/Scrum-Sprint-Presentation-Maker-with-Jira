package com.aksa.capacityplanner.leave.port.out;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface LeavePeriodRepositoryPort {
    LeavePeriod save(LeavePeriod period);

    Optional<LeavePeriod> findById(Long id);

    List<LeavePeriod> findByScope(LeaveScope scope);

    List<LeavePeriod> findByTeamMemberId(Long teamMemberId);

    List<LeavePeriod> findCompanyWideBetween(LocalDate from, LocalDate to);

    void deleteById(Long id);
}
