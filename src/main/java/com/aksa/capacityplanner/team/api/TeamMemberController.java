package com.aksa.capacityplanner.team.api;

import com.aksa.capacityplanner.team.api.dto.TeamMemberDto;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.facade.TeamFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teams/{teamId}/members")
public class TeamMemberController {

    private final TeamFacade teamFacade;

    public TeamMemberController(TeamFacade teamFacade) {
        this.teamFacade = teamFacade;
    }

    @GetMapping
    public List<TeamMemberDto> listMembers(@PathVariable Long teamId) {
        return teamFacade.listMembers(teamId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public TeamMemberDto addMember(@PathVariable Long teamId, @Valid @RequestBody MemberRequest request) {
        TeamMember member = new TeamMember(null, teamId, request.fullName(), request.role(), request.email(),
                request.startDate(), request.statusCode(), request.targetWorkDays(), false);
        return toDto(teamFacade.addMember(member));
    }

    @PutMapping("/{memberId}")
    public TeamMemberDto updateMember(@PathVariable Long teamId, @PathVariable Long memberId,
                                       @Valid @RequestBody MemberRequest request) {
        TeamMember member = new TeamMember(memberId, teamId, request.fullName(), request.role(), request.email(),
                request.startDate(), request.statusCode(), request.targetWorkDays(), false);
        return toDto(teamFacade.updateMember(memberId, member));
    }

    @PatchMapping("/{memberId}/status")
    public TeamMemberDto changeStatus(@PathVariable Long teamId, @PathVariable Long memberId,
                                       @RequestBody StatusChangeRequest request) {
        return toDto(teamFacade.changeStatus(memberId, request.statusCode()));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long teamId, @PathVariable Long memberId) {
        teamFacade.deleteMember(memberId);
        return ResponseEntity.noContent().build();
    }

    public record MemberRequest(@NotBlank String fullName, String role, String email,
                                 LocalDate startDate, String statusCode, BigDecimal targetWorkDays) {
    }

    public record StatusChangeRequest(@NotBlank String statusCode) {
    }

    private TeamMemberDto toDto(TeamMember member) {
        return new TeamMemberDto(member.getId(), member.getTeamId(), member.getFullName(), member.getRole(),
                member.getEmail(), member.getStartDate(), member.getStatusCode(), member.getTargetWorkDays(),
                member.isTargetWorkDaysOverridden(), member.getCustomFieldValues());
    }
}
