package com.aksa.capacityplanner.capacity.usecase;

import com.aksa.capacityplanner.capacity.api.dto.StatelessDashboardRequest;
import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService;
import com.aksa.capacityplanner.capacity.domain.CapacityCalculationService.CapacityCalculationInput;
import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;
import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.common.domain.DomainValidationException;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * "Ilk surum" (Part 1) icin: hicbir sey kalici hale getirmeden (ekip/uye/is kalemi
 * DB'ye yazilmadan), istekte gelen verilerle dogrudan CapacityCalculationService'i
 * calistirip sonucu doner. Mevcut kalici (persistent) akis - CapacityDashboardService,
 * WorkItemService, TeamMemberService vb. - bundan tamamen bagimsizdir ve degismeden
 * calismaya devam eder; Part 2'de veritabanina gecis istendiginde bu sinif kaldirilip
 * client dogrudan mevcut /api/teams/{teamId}/capacity-dashboard akisina yonlendirilebilir.
 */
@Service
public class StatelessCapacityDashboardService {

    private final HolidayCalendarPort holidayCalendarPort;
    private final CapacityCalculationService calculationService = new CapacityCalculationService();

    public StatelessCapacityDashboardService(HolidayCalendarPort holidayCalendarPort) {
        this.holidayCalendarPort = holidayCalendarPort;
    }

    public CapacityDashboard compute(StatelessDashboardRequest request) {
        List<StatusOption> statuses = request.statuses() == null ? List.of()
                : request.statuses().stream()
                        .map(s -> new StatusOption(null, null, s.code(), s.label(), s.countsAsCompleted(), null, 0))
                        .toList();
        validateStatusCodes(request, statuses);

        List<TeamMember> members = request.members().stream()
                .map(this::toTeamMember)
                .toList();

        List<WorkItem> workItems = request.workItems() == null ? List.of()
                : request.workItems().stream().map(this::toWorkItem).toList();

        Map<Long, BigDecimal> personalLeaveDays = request.personalLeaveDaysByMemberId() == null
                ? Map.of() : request.personalLeaveDaysByMemberId();

        Map<Long, BigDecimal> maintenanceOverrides = request.members().stream()
                .filter(m -> m.maintenanceAllocationPercent() != null)
                .collect(Collectors.toMap(StatelessDashboardRequest.MemberInput::clientId,
                        StatelessDashboardRequest.MemberInput::maintenanceAllocationPercent));

        int year = request.periodEnd().getYear();

        CapacityCalculationInput input = new CapacityCalculationInput(
                null, request.periodStart(), request.periodEnd(), request.reportDate(), request.previousSnapshotDate(),
                request.maintenanceAllocationPercent() == null ? BigDecimal.ZERO : request.maintenanceAllocationPercent(),
                workItems, members, statuses, personalLeaveDays, maintenanceOverrides,
                holidayCalendarPort.getFullDayHolidays(year),
                holidayCalendarPort.getHalfDayHolidays(year));

        return calculationService.calculate(input);
    }

    /**
     * statusCode burada sabit bir enum degil - istekte gelen "statuses" listesindeki
     * kodlardan biri olmali (bkz. StatusOption yorumu: her takim kendi statu listesini
     * yonetir). "statuses" bos/gonderilmemisse dogrulama atlanir (geriye donuk uyum).
     */
    private void validateStatusCodes(StatelessDashboardRequest request, List<StatusOption> statuses) {
        if (statuses.isEmpty()) return;
        Set<String> validCodes = statuses.stream().map(StatusOption::getCode).collect(Collectors.toSet());

        for (StatelessDashboardRequest.MemberInput m : request.members()) {
            if (m.statusCode() != null && !m.statusCode().isBlank() && !validCodes.contains(m.statusCode())) {
                throw new DomainValidationException(
                        "\"" + m.fullName() + "\" icin gecersiz statu kodu: " + m.statusCode());
            }
        }
        if (request.workItems() != null) {
            for (StatelessDashboardRequest.WorkItemInput wi : request.workItems()) {
                if (wi.statusCode() != null && !wi.statusCode().isBlank() && !validCodes.contains(wi.statusCode())) {
                    throw new DomainValidationException(
                            "\"" + wi.title() + "\" icin gecersiz statu kodu: " + wi.statusCode());
                }
            }
        }
    }

    private TeamMember toTeamMember(StatelessDashboardRequest.MemberInput input) {
        return new TeamMember(input.clientId(), null, input.fullName(), input.role(), null,
                input.startDate(), input.statusCode(), input.targetWorkDays(), input.targetWorkDays() != null);
    }

    private WorkItem toWorkItem(StatelessDashboardRequest.WorkItemInput input) {
        return new WorkItem(null, null, input.memberClientId(), input.title(), null,
                input.plannedEffortDays(), input.statusCode(), WorkItemSource.MANUAL,
                input.addedDate(), input.closedDate());
    }
}
