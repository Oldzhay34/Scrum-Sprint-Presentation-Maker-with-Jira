package com.aksa.capacityplanner.team.api;

import com.aksa.capacityplanner.team.api.dto.StatusOptionDto;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.facade.TeamFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams/{teamId}/statuses")
public class StatusOptionController {

    private final TeamFacade teamFacade;

    public StatusOptionController(TeamFacade teamFacade) {
        this.teamFacade = teamFacade;
    }

    @GetMapping
    public List<StatusOptionDto> listStatuses(@PathVariable Long teamId) {
        return teamFacade.listAvailableStatuses(teamId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public StatusOptionDto addStatus(@PathVariable Long teamId, @Valid @RequestBody StatusRequest request) {
        StatusOption option = new StatusOption(null, teamId, request.code(), request.label(),
                request.countsAsCompleted(), request.colorHex(), request.sortOrder());
        return toDto(teamFacade.addStatusOption(option));
    }

    public record StatusRequest(@NotBlank String code, @NotBlank String label,
                                 boolean countsAsCompleted, String colorHex, int sortOrder) {
    }

    private StatusOptionDto toDto(StatusOption option) {
        return new StatusOptionDto(option.getId(), option.getTeamId(), option.getCode(), option.getLabel(),
                option.isCountsAsCompleted(), option.getColorHex(), option.getSortOrder());
    }
}
