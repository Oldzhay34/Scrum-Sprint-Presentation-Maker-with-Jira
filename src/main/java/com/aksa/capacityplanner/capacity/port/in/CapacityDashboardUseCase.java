package com.aksa.capacityplanner.capacity.port.in;

import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;

import java.time.LocalDate;

public interface CapacityDashboardUseCase {

    CapacityDashboard getDashboard(DashboardQuery query);

    record DashboardQuery(Long teamId, LocalDate periodStart, LocalDate periodEnd,
                           LocalDate reportDate, LocalDate previousSnapshotDate) {
    }
}
