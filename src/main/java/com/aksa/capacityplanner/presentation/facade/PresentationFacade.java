package com.aksa.capacityplanner.presentation.facade;

import com.aksa.capacityplanner.presentation.domain.PresentationVersion;
import com.aksa.capacityplanner.presentation.domain.SprintPresentation;
import com.aksa.capacityplanner.presentation.port.in.PresentationUseCase;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * API katmaninin dogrudan erismeden kullandigi cephe. Projede @PreAuthorize
 * kullanilmiyor (bkz. auth/security/SecurityConfig) - yetkilendirme burada,
 * cagiranin rol/takim bilgisiyle yapiliyor: okuma herkese acik (PO baska
 * takimlari salt-okunur gorebilmeli), yazma/rollback sadece admin veya
 * kendi takimi icin.
 */
@Component
public class PresentationFacade {

    private final PresentationUseCase presentationUseCase;

    public PresentationFacade(PresentationUseCase presentationUseCase) {
        this.presentationUseCase = presentationUseCase;
    }

    public List<SprintPresentation> listByTeam(Long teamId) {
        return presentationUseCase.listByTeamReadOnly(teamId);
    }

    public SprintPresentation getById(Long id) {
        return presentationUseCase.getByIdReadOnly(id);
    }

    public SprintPresentation upsert(Long teamId, String sprintNo, String dateRange, Map<String, Object> content,
                                      String callerSicil, Long callerTeamId, boolean callerIsAdmin) {
        requireEditAccess(teamId, callerTeamId, callerIsAdmin);
        return presentationUseCase.upsert(teamId, sprintNo, dateRange, content, callerSicil);
    }

    public List<PresentationVersion> listVersions(Long presentationId) {
        return presentationUseCase.listVersions(presentationId);
    }

    public SprintPresentation rollback(Long presentationId, int version, String callerSicil, Long callerTeamId, boolean callerIsAdmin) {
        SprintPresentation presentation = presentationUseCase.getById(presentationId);
        requireEditAccess(presentation.getTeamId(), callerTeamId, callerIsAdmin);
        return presentationUseCase.rollback(presentationId, version, callerSicil);
    }

    private void requireEditAccess(Long targetTeamId, Long callerTeamId, boolean callerIsAdmin) {
        if (callerIsAdmin) {
            return;
        }
        if (callerTeamId == null || !callerTeamId.equals(targetTeamId)) {
            throw new AccessDeniedException("Bu takimin sunumlarini duzenleme yetkiniz yok.");
        }
    }
}
