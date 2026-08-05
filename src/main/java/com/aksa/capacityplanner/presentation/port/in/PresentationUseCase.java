package com.aksa.capacityplanner.presentation.port.in;

import com.aksa.capacityplanner.presentation.domain.PresentationVersion;
import com.aksa.capacityplanner.presentation.domain.SprintPresentation;

import java.util.List;
import java.util.Map;

public interface PresentationUseCase {

    List<SprintPresentation> listByTeam(Long teamId);

    SprintPresentation getById(Long id);

    /** Salt-okunur view (bkz. V5 migration) uzerinden okur - baska takim/admin goruntuleme yollarinda kullanilir. */
    List<SprintPresentation> listByTeamReadOnly(Long teamId);

    /** Salt-okunur view (bkz. V5 migration) uzerinden okur - baska takim/admin goruntuleme yollarinda kullanilir. */
    SprintPresentation getByIdReadOnly(Long id);

    /** Yoksa olusturur (version=1), varsa yeni bir versiyon olarak gunceller. */
    SprintPresentation upsert(Long teamId, String sprintNo, String dateRange, Map<String, Object> content, String updatedBySicil);

    List<PresentationVersion> listVersions(Long presentationId);

    /** Hedef versiyonun icerigini YENI bir versiyon olarak head'e kopyalar - gecmisi silmez. */
    SprintPresentation rollback(Long presentationId, int version, String updatedBySicil);
}
