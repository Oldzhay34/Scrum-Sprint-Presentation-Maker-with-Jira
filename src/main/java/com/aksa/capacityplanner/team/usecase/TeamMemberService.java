package com.aksa.capacityplanner.team.usecase;

import com.aksa.capacityplanner.common.domain.DomainValidationException;
import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.team.domain.TargetWorkDaysCalculator;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.in.TeamMemberUseCase;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import com.aksa.capacityplanner.team.port.out.StatusOptionRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class TeamMemberService implements TeamMemberUseCase {

    private final TeamMemberRepositoryPort memberRepository;
    private final HolidayCalendarPort holidayCalendarPort;
    private final StatusOptionRepositoryPort statusOptionRepository;

    public TeamMemberService(TeamMemberRepositoryPort memberRepository, HolidayCalendarPort holidayCalendarPort,
                              StatusOptionRepositoryPort statusOptionRepository) {
        this.memberRepository = memberRepository;
        this.holidayCalendarPort = holidayCalendarPort;
        this.statusOptionRepository = statusOptionRepository;
    }

    @Override
    @CacheEvict(value = "team-members-by-team", key = "#member.teamId")
    public TeamMember addMember(TeamMember member) {
        validateStatusCode(member.getTeamId(), member.getStatusCode());
        if (member.getTargetWorkDays() == null) {
            int year = member.getStartDate() != null ? member.getStartDate().getYear() : LocalDate.now().getYear();
            BigDecimal defaultTarget = TargetWorkDaysCalculator.calculateDefault(
                    member.getStartDate(), year,
                    holidayCalendarPort.getFullDayHolidays(year),
                    holidayCalendarPort.getHalfDayHolidays(year));
            member.setTargetWorkDays(defaultTarget);
            member.setTargetWorkDaysOverridden(false);
        } else {
            member.setTargetWorkDaysOverridden(true);
        }
        return memberRepository.save(member);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "team-members", key = "#id"),
            @CacheEvict(value = "team-members-by-team", allEntries = true)
    })
    public TeamMember updateMember(Long id, TeamMember member) {
        TeamMember existing = getMember(id);
        validateStatusCode(existing.getTeamId(), member.getStatusCode());
        existing.setFullName(member.getFullName());
        existing.setRole(member.getRole());
        existing.setEmail(member.getEmail());
        existing.setStartDate(member.getStartDate());
        existing.setStatusCode(member.getStatusCode());
        return memberRepository.save(existing);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "team-members", key = "#id"),
            @CacheEvict(value = "team-members-by-team", allEntries = true)
    })
    public TeamMember changeStatus(Long id, String statusCode) {
        TeamMember existing = getMember(id);
        validateStatusCode(existing.getTeamId(), statusCode);
        existing.setStatusCode(statusCode);
        return memberRepository.save(existing);
    }

    /** statusCode bos degilse, takim icin tanimli (genel + takima ozgu) statulerden biri olmali. */
    private void validateStatusCode(Long teamId, String statusCode) {
        if (statusCode == null || statusCode.isBlank()) return;
        boolean exists = statusOptionRepository.findAvailableForTeam(teamId).stream()
                .anyMatch(s -> s.getCode().equals(statusCode));
        if (!exists) {
            throw new DomainValidationException("Gecersiz statu kodu: " + statusCode);
        }
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "team-members", key = "#id"),
            @CacheEvict(value = "team-members-by-team", allEntries = true)
    })
    public TeamMember overrideTargetWorkDays(Long id, BigDecimal targetWorkDays) {
        TeamMember existing = getMember(id);
        existing.setTargetWorkDays(targetWorkDays);
        existing.setTargetWorkDaysOverridden(true);
        return memberRepository.save(existing);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "team-members", key = "#id"),
            @CacheEvict(value = "team-members-by-team", allEntries = true)
    })
    public TeamMember setCustomFieldValue(Long id, String fieldKey, String value) {
        TeamMember existing = getMember(id);
        existing.getCustomFieldValues().put(fieldKey, value);
        return memberRepository.save(existing);
    }

    @Override
    @Cacheable(value = "team-members", key = "#id")
    public TeamMember getMember(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ekip uyesi bulunamadi: id=" + id));
    }

    @Override
    @Cacheable(value = "team-members-by-team", key = "#teamId")
    public List<TeamMember> listByTeam(Long teamId) {
        return memberRepository.findByTeamId(teamId);
    }

    @Override
    @Caching(evict = {
            @CacheEvict(value = "team-members", key = "#id"),
            @CacheEvict(value = "team-members-by-team", allEntries = true)
    })
    public void deleteMember(Long id) {
        memberRepository.deleteById(id);
    }
}
