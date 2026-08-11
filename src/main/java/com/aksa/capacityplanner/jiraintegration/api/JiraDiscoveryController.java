package com.aksa.capacityplanner.jiraintegration.api;

import com.aksa.capacityplanner.jiraintegration.adapter.JiraDiscoveryService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * docs/jira-endpoint-plani.md Faz 0 (kesif) cagrilarini uygulama uzerinden
 * calistirmak icin. jira.enabled=false iken bu controller (ve JiraDiscoveryService)
 * hic olusturulmaz - sadece gercek bir Jira baglantisi kurulunca aktif olur.
 */
@RestController
@RequestMapping("/api/jira-discovery")
@ConditionalOnProperty(prefix = "jira", name = "enabled", havingValue = "true")
public class JiraDiscoveryController {

    private final JiraDiscoveryService discoveryService;

    public JiraDiscoveryController(JiraDiscoveryService discoveryService) {
        this.discoveryService = discoveryService;
    }

    @GetMapping("/fields")
    public List<Map<String, Object>> fields() {
        return discoveryService.listFields();
    }

    @GetMapping("/projects")
    public Map<String, Object> projects() {
        return discoveryService.listProjects();
    }

    @GetMapping("/statuses")
    public List<Map<String, Object>> statuses() {
        return discoveryService.listStatuses();
    }

    @GetMapping("/priorities")
    public List<Map<String, Object>> priorities() {
        return discoveryService.listPriorities();
    }

    @GetMapping("/boards/{projectKey}")
    public Map<String, Object> boards(@PathVariable String projectKey) {
        return discoveryService.listBoards(projectKey);
    }

    /** Proje filtresi olmadan - admin token'in gordugu TUM board'lar (tum takimlar). */
    @GetMapping("/boards")
    public List<Map<String, Object>> allBoards() {
        return discoveryService.listAllBoards();
    }

    @GetMapping("/boards/id/{boardId}/active-sprint")
    public Map<String, Object> activeSprint(@PathVariable Long boardId) {
        return discoveryService.getActiveSprint(boardId);
    }

    /** Instance'daki HER takimin (her scrum board'un) o anki aktif sprinti - tek cagride genel goruntu. */
    @GetMapping("/active-sprints")
    public List<Map<String, Object>> activeSprintsAcrossAllTeams() {
        return discoveryService.listActiveSprintsAcrossAllTeams();
    }
}
