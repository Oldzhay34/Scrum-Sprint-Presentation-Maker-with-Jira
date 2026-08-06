package com.aksa.capacityplanner.monitoring.facade;

import com.aksa.capacityplanner.monitoring.domain.ActionOption;
import com.aksa.capacityplanner.monitoring.domain.ActorOption;
import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import com.aksa.capacityplanner.monitoring.domain.AuditLogPage;
import com.aksa.capacityplanner.monitoring.domain.AuditSummary;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.port.out.TeamRepositoryPort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Monitoring sayfasi sadece admin'e acik - PresentationFacade'deki gibi
 * (bkz. auth/security/SecurityConfig yorumu) yetkilendirme burada, cagiranin
 * rolune gore yapiliyor, @PreAuthorize kullanilmiyor.
 */
@Component
public class MonitoringFacade {

    private final AuditLogRepositoryPort auditLogRepository;
    private final TeamRepositoryPort teamRepository;

    public MonitoringFacade(AuditLogRepositoryPort auditLogRepository, TeamRepositoryPort teamRepository) {
        this.auditLogRepository = auditLogRepository;
        this.teamRepository = teamRepository;
    }

    public AuditLogPage search(AuditLogFilter filter, int page, int size, boolean callerIsAdmin) {
        requireAdmin(callerIsAdmin);
        return auditLogRepository.search(filter, page, size);
    }

    public AuditSummary summary(boolean callerIsAdmin) {
        requireAdmin(callerIsAdmin);
        return auditLogRepository.summary();
    }

    public List<ActorOption> listActors(boolean callerIsAdmin) {
        requireAdmin(callerIsAdmin);
        return auditLogRepository.listDistinctActors();
    }

    public List<ActionOption> listActions(boolean callerIsAdmin) {
        requireAdmin(callerIsAdmin);
        return auditLogRepository.listDistinctActions();
    }

    /** Filtre/gorunum icin takim id -> ad eslemesi (silinmis bir takima ait eski loglar icin ad bos doner). */
    public Map<Long, String> teamNamesById(boolean callerIsAdmin) {
        requireAdmin(callerIsAdmin);
        return teamRepository.findAll().stream().collect(Collectors.toMap(Team::getId, Team::getName));
    }

    private void requireAdmin(boolean callerIsAdmin) {
        if (!callerIsAdmin) {
            throw new AccessDeniedException("Bu sayfaya erisim yetkiniz yok.");
        }
    }
}
