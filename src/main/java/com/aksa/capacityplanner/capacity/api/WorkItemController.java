package com.aksa.capacityplanner.capacity.api;

import com.aksa.capacityplanner.capacity.api.dto.WorkItemDto;
import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.capacity.facade.CapacityFacade;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teams/{teamId}/work-items")
public class WorkItemController {

    private final CapacityFacade capacityFacade;

    public WorkItemController(CapacityFacade capacityFacade) {
        this.capacityFacade = capacityFacade;
    }

    @GetMapping
    public List<WorkItemDto> list(@PathVariable Long teamId) {
        return capacityFacade.listWorkItems(teamId).stream().map(this::toDto).toList();
    }

    @PostMapping
    public WorkItemDto create(@PathVariable Long teamId, @Valid @RequestBody WorkItemRequest request) {
        WorkItem item = new WorkItem(null, teamId, request.teamMemberId(), request.title(), request.jiraIssueKey(),
                request.plannedEffortDays(), request.statusCode(), WorkItemSource.MANUAL, request.addedDate(), null);
        return toDto(capacityFacade.addWorkItem(item));
    }

    @PutMapping("/{id}")
    public WorkItemDto update(@PathVariable Long teamId, @PathVariable Long id,
                               @Valid @RequestBody WorkItemRequest request) {
        WorkItem item = new WorkItem(id, teamId, request.teamMemberId(), request.title(), request.jiraIssueKey(),
                request.plannedEffortDays(), request.statusCode(), WorkItemSource.MANUAL, request.addedDate(), null);
        return toDto(capacityFacade.updateWorkItem(id, item));
    }

    @PatchMapping("/{id}/status")
    public WorkItemDto changeStatus(@PathVariable Long teamId, @PathVariable Long id,
                                     @RequestBody StatusChangeRequest request) {
        return toDto(capacityFacade.changeStatus(id, request.statusCode()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long teamId, @PathVariable Long id) {
        capacityFacade.deleteWorkItem(id);
        return ResponseEntity.noContent().build();
    }

    public record WorkItemRequest(Long teamMemberId, @NotBlank String title, String jiraIssueKey,
                                   @NotNull BigDecimal plannedEffortDays, String statusCode, LocalDate addedDate) {
    }

    public record StatusChangeRequest(@NotBlank String statusCode) {
    }

    private WorkItemDto toDto(WorkItem item) {
        return new WorkItemDto(item.getId(), item.getTeamId(), item.getTeamMemberId(), item.getTitle(),
                item.getJiraIssueKey(), item.getPlannedEffortDays(), item.getStatusCode(), item.getSource(),
                item.getAddedDate(), item.getClosedDate());
    }
}
