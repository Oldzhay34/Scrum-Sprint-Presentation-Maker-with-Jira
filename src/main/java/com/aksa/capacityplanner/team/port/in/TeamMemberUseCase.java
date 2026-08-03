package com.aksa.capacityplanner.team.port.in;

import com.aksa.capacityplanner.team.domain.TeamMember;

import java.math.BigDecimal;
import java.util.List;

public interface TeamMemberUseCase {

    /** Uye eklenirken targetWorkDays verilmemisse TargetWorkDaysCalculator ile otomatik hesaplanir. */
    TeamMember addMember(TeamMember member);

    TeamMember updateMember(Long id, TeamMember member);

    TeamMember changeStatus(Long id, String statusCode);

    TeamMember overrideTargetWorkDays(Long id, BigDecimal targetWorkDays);

    TeamMember setCustomFieldValue(Long id, String fieldKey, String value);

    TeamMember getMember(Long id);

    List<TeamMember> listByTeam(Long teamId);

    void deleteMember(Long id);
}
