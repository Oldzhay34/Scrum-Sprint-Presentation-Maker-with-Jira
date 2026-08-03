package com.aksa.capacityplanner.jiraintegration.api;

import com.aksa.capacityplanner.jiraintegration.usecase.JiraSyncTriggerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/teams/{teamId}/jira-sync")
public class JiraSyncController {

    private final JiraSyncTriggerService triggerService;

    public JiraSyncController(JiraSyncTriggerService triggerService) {
        this.triggerService = triggerService;
    }

    @PostMapping
    public ResponseEntity<Void> triggerSync(@PathVariable Long teamId, @Valid @RequestBody SyncRequest request) {
        triggerService.requestSync(teamId, request.jiraProjectKey(), request.jql());
        return ResponseEntity.accepted().build();
    }

    public record SyncRequest(@NotBlank String jiraProjectKey, String jql) {
    }
}
