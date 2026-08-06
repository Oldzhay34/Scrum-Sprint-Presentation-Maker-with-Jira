package com.aksa.capacityplanner.team.api;

import com.aksa.capacityplanner.team.api.dto.CustomFieldDefinitionDto;
import com.aksa.capacityplanner.team.api.dto.TeamDto;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition;
import com.aksa.capacityplanner.team.domain.TeamType;
import com.aksa.capacityplanner.team.facade.TeamFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamFacade teamFacade;

    public TeamController(TeamFacade teamFacade) {
        this.teamFacade = teamFacade;
    }

    @GetMapping
    public List<TeamDto> listTeams() {
        return teamFacade.listTeams().stream().map(this::toDto).toList();
    }

    @GetMapping("/{id}")
    public TeamDto getTeam(@PathVariable Long id) {
        return toDto(teamFacade.getTeam(id));
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@Valid @RequestBody TeamRequest request) {
        Team created = teamFacade.createTeam(toDomain(request));
        return ResponseEntity.ok(toDto(created));
    }

    @PutMapping("/{id}")
    public TeamDto updateTeam(@PathVariable Long id, @Valid @RequestBody TeamRequest request) {
        return toDto(teamFacade.updateTeam(id, toDomain(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamFacade.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{teamId}/custom-fields")
    public List<CustomFieldDefinitionDto> listCustomFields(@PathVariable Long teamId) {
        return teamFacade.listCustomFields(teamId).stream().map(this::toDto).toList();
    }

    @PostMapping("/{teamId}/custom-fields")
    public CustomFieldDefinitionDto addCustomField(@PathVariable Long teamId,
                                                     @Valid @RequestBody CustomFieldRequest request) {
        TeamCustomFieldDefinition definition = new TeamCustomFieldDefinition(
                null, teamId, request.fieldKey(), request.label(), request.type(),
                request.required(), request.sortOrder());
        return toDto(teamFacade.addCustomField(teamId, definition));
    }

    @DeleteMapping("/{teamId}/custom-fields/{fieldId}")
    public ResponseEntity<Void> removeCustomField(@PathVariable Long teamId, @PathVariable Long fieldId) {
        teamFacade.removeCustomField(teamId, fieldId);
        return ResponseEntity.noContent().build();
    }

    public record CustomFieldRequest(@NotBlank String fieldKey, @NotBlank String label,
                                      com.aksa.capacityplanner.team.domain.CustomFieldType type,
                                      boolean required, int sortOrder) {
    }

    public record TeamRequest(@NotBlank String name, String description,
                               BigDecimal maintenanceAllocationPercent, BigDecimal defaultTargetWorkDays,
                               TeamType teamType) {
    }

    private Team toDomain(TeamRequest request) {
        return new Team(null, request.name(), request.description(),
                request.maintenanceAllocationPercent(), request.defaultTargetWorkDays(), request.teamType());
    }

    private TeamDto toDto(Team team) {
        return new TeamDto(team.getId(), team.getName(), team.getDescription(),
                team.getMaintenanceAllocationPercent(), team.getDefaultTargetWorkDays(), team.getTeamType());
    }

    private CustomFieldDefinitionDto toDto(TeamCustomFieldDefinition definition) {
        return new CustomFieldDefinitionDto(definition.getId(), definition.getTeamId(), definition.getFieldKey(),
                definition.getLabel(), definition.getType(), definition.isRequired(), definition.getSortOrder());
    }
}
