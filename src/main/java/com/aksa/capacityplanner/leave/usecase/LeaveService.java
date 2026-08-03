package com.aksa.capacityplanner.leave.usecase;

import com.aksa.capacityplanner.common.domain.DateRange;
import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.port.in.LeaveUseCase;
import com.aksa.capacityplanner.leave.port.out.LeavePeriodRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
public class LeaveService implements LeaveUseCase {

    private final LeavePeriodRepositoryPort repository;

    public LeaveService(LeavePeriodRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public LeavePeriod createLeavePeriod(LeavePeriod period) {
        return repository.save(period);
    }

    @Override
    public LeavePeriod updateLeavePeriod(Long id, LeavePeriod period) {
        LeavePeriod existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Izin donemi bulunamadi: id=" + id));
        existing.setName(period.getName());
        existing.setType(period.getType());
        existing.setScope(period.getScope());
        existing.setTeamMemberId(period.getTeamMemberId());
        existing.setStartDate(period.getStartDate());
        existing.setEndDate(period.getEndDate());
        existing.setDayFraction(period.getDayFraction());
        existing.setDescription(period.getDescription());
        return repository.save(existing);
    }

    @Override
    public void deleteLeavePeriod(Long id) {
        repository.deleteById(id);
    }

    @Override
    public List<LeavePeriod> listCompanyWideLeaves() {
        return repository.findByScope(LeaveScope.COMPANY_WIDE);
    }

    @Override
    public List<LeavePeriod> listLeavesForMember(Long teamMemberId) {
        return repository.findByTeamMemberId(teamMemberId);
    }

    @Override
    public BigDecimal calculateApprovedLeaveDays(Long teamMemberId, LocalDate from, LocalDate to) {
        DateRange window = new DateRange(from, to);
        BigDecimal total = BigDecimal.ZERO;
        for (LeavePeriod period : repository.findByTeamMemberId(teamMemberId)) {
            DateRange overlap = period.toDateRange().intersect(window);
            if (overlap == null) {
                continue;
            }
            long overlapBusinessDays = overlap.start().datesUntil(overlap.end().plusDays(1))
                    .filter(d -> d.getDayOfWeek() != DayOfWeek.SATURDAY && d.getDayOfWeek() != DayOfWeek.SUNDAY)
                    .count();
            total = total.add(period.getDayFraction().multiply(BigDecimal.valueOf(overlapBusinessDays)));
        }
        return total;
    }
}
