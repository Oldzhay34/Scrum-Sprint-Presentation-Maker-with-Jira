package com.aksa.capacityplanner.capacity.usecase;

import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService;
import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService.CapacityCalculationInput;
import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;
import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.in.CapacityDashboardUseCase;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.leave.port.in.LeaveUseCase;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.in.TeamMemberUseCase;
import com.aksa.capacityplanner.team.port.in.TeamUseCase;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import com.aksa.capacityplanner.team.port.out.StatusOptionRepositoryPort;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CapacityDashboardService implements CapacityDashboardUseCase {

    private final WorkItemRepositoryPort workItemRepository;
    private final TeamUseCase teamUseCase;
    private final TeamMemberUseCase teamMemberUseCase;
    private final StatusOptionRepositoryPort statusOptionRepository;
    private final LeaveUseCase leaveUseCase;
    private final HolidayCalendarPort holidayCalendarPort;
    private final CapacityCalculationService calculationService = new CapacityCalculationService();

    public CapacityDashboardService(WorkItemRepositoryPort workItemRepository, TeamUseCase teamUseCase,
                                     TeamMemberUseCase teamMemberUseCase, StatusOptionRepositoryPort statusOptionRepository,
                                     LeaveUseCase leaveUseCase, HolidayCalendarPort holidayCalendarPort) {
        this.workItemRepository = workItemRepository;
        this.teamUseCase = teamUseCase;
        this.teamMemberUseCase = teamMemberUseCase;
        this.statusOptionRepository = statusOptionRepository;
        this.leaveUseCase = leaveUseCase;
        this.holidayCalendarPort = holidayCalendarPort;
    }

    @Override
    @Cacheable(value = "capacity-dashboard", key = "#query")
    public CapacityDashboard getDashboard(DashboardQuery query) {
        Team team = teamUseCase.getTeam(query.teamId());
        List<TeamMember> members = teamMemberUseCase.listByTeam(query.teamId());
        List<WorkItem> workItems = workItemRepository.findByTeamId(query.teamId());
        int year = query.periodEnd().getYear();

        Map<Long, BigDecimal> approvedLeaveDaysByMember = members.stream()
                .collect(Collectors.toMap(TeamMember::getId,
                        m -> leaveUseCase.calculateApprovedLeaveDays(m.getId(), query.reportDate(), query.periodEnd())));

        CapacityCalculationInput input = new CapacityCalculationInput(
                query.teamId(), query.periodStart(), query.periodEnd(), query.reportDate(), query.previousSnapshotDate(),
                team.getMaintenanceAllocationPercent(), workItems, members,
                statusOptionRepository.findAvailableForTeam(query.teamId()),
                approvedLeaveDaysByMember,
                Map.of(),
                holidayCalendarPort.getFullDayHolidays(year),
                holidayCalendarPort.getHalfDayHolidays(year));

        return calculationService.calculate(input);
    }
}
