package com.aksa.capacityplanner.leave.adapter.out.persistence;

import com.aksa.capacityplanner.leave.domain.LeaveScope;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LeavePeriodJpaRepository extends JpaRepository<LeavePeriodJpaEntity, Long> {
    List<LeavePeriodJpaEntity> findByScope(LeaveScope scope);

    List<LeavePeriodJpaEntity> findByTeamMemberId(Long teamMemberId);

    List<LeavePeriodJpaEntity> findByScopeAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            LeaveScope scope, LocalDate to, LocalDate from);
}
