package com.aksa.capacityplanner.monitoring.api;

import com.aksa.capacityplanner.auth.domain.Role;
import com.aksa.capacityplanner.auth.security.JwtTokenProvider;
import com.aksa.capacityplanner.monitoring.api.dto.AuditLogDto;
import com.aksa.capacityplanner.monitoring.api.dto.AuditLogPageDto;
import com.aksa.capacityplanner.monitoring.api.dto.AuditSummaryDto;
import com.aksa.capacityplanner.monitoring.api.dto.FilterOptionsDto;
import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import com.aksa.capacityplanner.monitoring.domain.AuditLogPage;
import com.aksa.capacityplanner.monitoring.domain.AuditSummary;
import com.aksa.capacityplanner.monitoring.facade.MonitoringFacade;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Sadece admin - /admin/monitoring sayfasinin backend'i. */
@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringFacade monitoringFacade;

    public MonitoringController(MonitoringFacade monitoringFacade) {
        this.monitoringFacade = monitoringFacade;
    }

    @GetMapping("/audit-logs")
    public AuditLogPageDto listAuditLogs(
            @RequestParam(required = false) String actorSicil,
            @RequestParam(required = false) String actionCode,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            Authentication authentication) {
        boolean isAdmin = requireAdmin(authentication);
        AuditLogFilter filter = new AuditLogFilter(actorSicil, actionCode, entityType, teamId, success, from, to);
        AuditLogPage result = monitoringFacade.search(filter, page, Math.min(size, 100), isAdmin);
        Map<Long, String> teamNames = monitoringFacade.teamNamesById(isAdmin);
        return new AuditLogPageDto(
                result.content().stream().map(l -> AuditLogDto.from(l, teamNames.get(l.getTeamId()))).toList(),
                result.page(), result.size(), result.totalElements(), result.totalPages());
    }

    @GetMapping("/summary")
    public AuditSummaryDto summary(Authentication authentication) {
        boolean isAdmin = requireAdmin(authentication);
        AuditSummary summary = monitoringFacade.summary(isAdmin);
        Map<Long, String> teamNames = monitoringFacade.teamNamesById(isAdmin);
        AuditLogDto last = summary.lastAction() == null ? null
                : AuditLogDto.from(summary.lastAction(), teamNames.get(summary.lastAction().getTeamId()));
        return new AuditSummaryDto(summary.actionsToday(), summary.activeActorsToday(), summary.topActionLabelToday(),
                last, summary.totalActions());
    }

    @GetMapping("/filters")
    public FilterOptionsDto filters(Authentication authentication) {
        boolean isAdmin = requireAdmin(authentication);
        return new FilterOptionsDto(monitoringFacade.listActors(isAdmin), monitoringFacade.listActions(isAdmin),
                monitoringFacade.teamNamesById(isAdmin));
    }

    private boolean requireAdmin(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof JwtTokenProvider.AccessTokenClaims claims)) {
            throw new AccessDeniedException("Oturum bulunamadi.");
        }
        return claims.role() == Role.ADMIN;
    }
}
