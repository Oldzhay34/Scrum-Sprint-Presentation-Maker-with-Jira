package com.aksa.capacityplanner.capacity.api;

import com.aksa.capacityplanner.capacity.api.dto.CapacityDashboardDto;
import com.aksa.capacityplanner.capacity.facade.CapacityFacade;
import com.aksa.capacityplanner.capacity.port.in.CapacityDashboardUseCase.DashboardQuery;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.Month;

@RestController
@RequestMapping("/api/teams/{teamId}/capacity-dashboard")
public class CapacityDashboardController {

    private final CapacityFacade capacityFacade;
    private final CapacityDashboardMapper mapper;

    public CapacityDashboardController(CapacityFacade capacityFacade, CapacityDashboardMapper mapper) {
        this.capacityFacade = capacityFacade;
        this.mapper = mapper;
    }

    @GetMapping
    public CapacityDashboardDto getDashboard(
            @PathVariable Long teamId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate reportDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodStart,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate periodEnd,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate previousSnapshotDate) {

        LocalDate effectiveReportDate = reportDate != null ? reportDate : LocalDate.now();
        int year = effectiveReportDate.getYear();
        LocalDate effectivePeriodStart = periodStart != null ? periodStart : LocalDate.of(year, Month.JUNE, 1);
        LocalDate effectivePeriodEnd = periodEnd != null ? periodEnd : LocalDate.of(year, Month.DECEMBER, 31);

        DashboardQuery query = new DashboardQuery(teamId, effectivePeriodStart, effectivePeriodEnd,
                effectiveReportDate, previousSnapshotDate);
        return mapper.toDto(capacityFacade.getDashboard(query));
    }
}
