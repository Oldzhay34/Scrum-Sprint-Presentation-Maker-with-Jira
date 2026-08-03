package com.aksa.capacityplanner.leave.api;

import com.aksa.capacityplanner.leave.api.dto.LeavePeriodDto;
import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.domain.LeaveType;
import com.aksa.capacityplanner.leave.facade.LeaveFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/leave-periods")
public class LeavePeriodController {

    private final LeaveFacade leaveFacade;

    public LeavePeriodController(LeaveFacade leaveFacade) {
        this.leaveFacade = leaveFacade;
    }

    @GetMapping("/company-wide")
    public List<LeavePeriodDto> listCompanyWide() {
        return leaveFacade.listCompanyWideLeaves().stream().map(this::toDto).toList();
    }

    @GetMapping("/members/{teamMemberId}")
    public List<LeavePeriodDto> listForMember(@PathVariable Long teamMemberId) {
        return leaveFacade.listLeavesForMember(teamMemberId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public LeavePeriodDto create(@Valid @RequestBody LeavePeriodRequest request) {
        return toDto(leaveFacade.createLeavePeriod(toDomain(null, request)));
    }

    @PutMapping("/{id}")
    public LeavePeriodDto update(@PathVariable Long id, @Valid @RequestBody LeavePeriodRequest request) {
        return toDto(leaveFacade.updateLeavePeriod(id, toDomain(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        leaveFacade.deleteLeavePeriod(id);
        return ResponseEntity.noContent().build();
    }

    public record LeavePeriodRequest(@NotBlank String name, @NotNull LeaveType type, @NotNull LeaveScope scope,
                                      Long teamMemberId, @NotNull LocalDate startDate, @NotNull LocalDate endDate,
                                      @NotNull BigDecimal dayFraction, String description) {
    }

    private LeavePeriod toDomain(Long id, LeavePeriodRequest request) {
        return new LeavePeriod(id, request.name(), request.type(), request.scope(), request.teamMemberId(),
                request.startDate(), request.endDate(), request.dayFraction(), request.description());
    }

    private LeavePeriodDto toDto(LeavePeriod period) {
        return new LeavePeriodDto(period.getId(), period.getName(), period.getType(), period.getScope(),
                period.getTeamMemberId(), period.getStartDate(), period.getEndDate(),
                period.getDayFraction(), period.getDescription());
    }
}
