package com.aksa.capacityplanner.leave.adapter.out.persistence;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.port.out.LeavePeriodRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class LeavePeriodPersistenceAdapter implements LeavePeriodRepositoryPort {

    private final LeavePeriodJpaRepository jpaRepository;

    public LeavePeriodPersistenceAdapter(LeavePeriodJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public LeavePeriod save(LeavePeriod period) {
        return toDomain(jpaRepository.save(toEntity(period)));
    }

    @Override
    public Optional<LeavePeriod> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<LeavePeriod> findByScope(LeaveScope scope) {
        return jpaRepository.findByScope(scope).stream().map(this::toDomain).toList();
    }

    @Override
    public List<LeavePeriod> findByTeamMemberId(Long teamMemberId) {
        return jpaRepository.findByTeamMemberId(teamMemberId).stream().map(this::toDomain).toList();
    }

    @Override
    public List<LeavePeriod> findCompanyWideBetween(LocalDate from, LocalDate to) {
        return jpaRepository.findByScopeAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        LeaveScope.COMPANY_WIDE, to, from)
                .stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private LeavePeriodJpaEntity toEntity(LeavePeriod period) {
        LeavePeriodJpaEntity entity = new LeavePeriodJpaEntity();
        entity.setId(period.getId());
        entity.setName(period.getName());
        entity.setType(period.getType());
        entity.setScope(period.getScope());
        entity.setTeamMemberId(period.getTeamMemberId());
        entity.setStartDate(period.getStartDate());
        entity.setEndDate(period.getEndDate());
        entity.setDayFraction(period.getDayFraction());
        entity.setDescription(period.getDescription());
        return entity;
    }

    private LeavePeriod toDomain(LeavePeriodJpaEntity entity) {
        return new LeavePeriod(entity.getId(), entity.getName(), entity.getType(), entity.getScope(),
                entity.getTeamMemberId(), entity.getStartDate(), entity.getEndDate(),
                entity.getDayFraction(), entity.getDescription());
    }
}
