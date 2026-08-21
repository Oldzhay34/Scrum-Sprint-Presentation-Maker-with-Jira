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
        // Bu endpoint SADECE "Jira'dan" sekmesi tarafindan cagirilir (bkz.
        // useJiraDashboard.js) - Excel/Manuel modlari kendi ayri yollarindan
        // besleniyor (Excel istemci tarafinda parse edilir, Manuel stateless
        // bir uca gider), ikisi de bu DB tablosuna hic dokunmuyor. Buradaki
        // team_members tablosu ise HEM Jira senkronundan (jiraAccountId dolu)
        // HEM de baska bir yoldan (orn. Excel yuklerken izin gunu takibi icin
        // otomatik olusturulan kayitlar, bkz. autoApplyCompanyHolidays.js)
        // doluyor. Jira gorunumu SADECE gercekten Jira'dan gelen kisileri
        // gostermeli - kullanici teyidi 2026-08-20: "jiradan çekildiğinde bu
        // excelden gelen isimler gelmesin" (ekranda Jira'dan gelen tek gercek
        // kisinin yaninda sifir veriyle bir sürü "hayalet" kisi gorunuyordu).
        List<TeamMember> members = teamMemberUseCase.listByTeam(query.teamId()).stream()
                .filter(m -> m.getJiraAccountId() != null)
                .toList();
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
