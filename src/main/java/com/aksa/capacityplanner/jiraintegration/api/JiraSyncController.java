package com.aksa.capacityplanner.jiraintegration.api;

import com.aksa.capacityplanner.common.domain.DomainValidationException;
import com.aksa.capacityplanner.jiraintegration.usecase.JiraSyncTriggerService;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.facade.TeamFacade;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * jiraProjectKey verilmezse takima kayitli varsayilan (Team.jiraProjectKey,
 * bkz. V18__teams_add_jira_config.sql) kullanilir - boylece 6 bilinen takim
 * icin cagiran taraf (frontend/manuel istek) proje anahtarini bilmek zorunda
 * kalmaz. Takimda da tanimli degilse (orn. henuz Jira'si olmayan CBS takimi)
 * istek 400 ile reddedilir.
 */
@RestController
@RequestMapping("/api/teams/{teamId}/jira-sync")
public class JiraSyncController {

    private final JiraSyncTriggerService triggerService;
    private final TeamFacade teamFacade;

    public JiraSyncController(JiraSyncTriggerService triggerService, TeamFacade teamFacade) {
        this.triggerService = triggerService;
        this.teamFacade = teamFacade;
    }

    @PostMapping
    public ResponseEntity<Void> triggerSync(@PathVariable Long teamId, @Valid @RequestBody SyncRequest request) {
        String jiraProjectKey = resolveProjectKey(teamId, request.jiraProjectKey());
        triggerService.requestSync(teamId, jiraProjectKey, request.jql());
        return ResponseEntity.accepted().build();
    }

    private String resolveProjectKey(Long teamId, String requestedProjectKey) {
        if (requestedProjectKey != null && !requestedProjectKey.isBlank()) {
            return requestedProjectKey;
        }
        Team team = teamFacade.getTeam(teamId);
        if (team.getJiraProjectKey() == null || team.getJiraProjectKey().isBlank()) {
            throw new DomainValidationException(
                    "Takim icin Jira proje anahtari tanimli degil (id=" + teamId
                            + "). jiraProjectKey'i istekte belirtin veya takima kaydedin.");
        }
        return team.getJiraProjectKey();
    }

    public record SyncRequest(String jiraProjectKey, String jql) {
    }
}
