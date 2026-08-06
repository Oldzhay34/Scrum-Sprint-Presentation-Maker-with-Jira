package com.aksa.capacityplanner.presentation.usecase;

import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.presentation.domain.PresentationDownloadLog;
import com.aksa.capacityplanner.presentation.domain.PresentationVersion;
import com.aksa.capacityplanner.presentation.domain.SprintPresentation;
import com.aksa.capacityplanner.presentation.port.in.PresentationUseCase;
import com.aksa.capacityplanner.presentation.port.out.PresentationDownloadLogRepositoryPort;
import com.aksa.capacityplanner.presentation.port.out.PresentationRepositoryPort;
import com.aksa.capacityplanner.presentation.port.out.PresentationVersionRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class PresentationService implements PresentationUseCase {

    private final PresentationRepositoryPort presentationRepository;
    private final PresentationVersionRepositoryPort versionRepository;
    private final PresentationDownloadLogRepositoryPort downloadLogRepository;

    public PresentationService(PresentationRepositoryPort presentationRepository,
                                PresentationVersionRepositoryPort versionRepository,
                                PresentationDownloadLogRepositoryPort downloadLogRepository) {
        this.presentationRepository = presentationRepository;
        this.versionRepository = versionRepository;
        this.downloadLogRepository = downloadLogRepository;
    }

    @Override
    public List<SprintPresentation> listByTeam(Long teamId) {
        return presentationRepository.findByTeamId(teamId);
    }

    @Override
    public SprintPresentation getById(Long id) {
        return presentationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sunum bulunamadi: id=" + id));
    }

    @Override
    public List<SprintPresentation> listByTeamReadOnly(Long teamId) {
        return presentationRepository.findByTeamIdReadOnly(teamId);
    }

    @Override
    public SprintPresentation getByIdReadOnly(Long id) {
        return presentationRepository.findByIdReadOnly(id)
                .orElseThrow(() -> new NotFoundException("Sunum bulunamadi: id=" + id));
    }

    @Override
    @Transactional
    public SprintPresentation upsert(Long teamId, String sprintNo, String dateRange, Map<String, Object> content, String updatedBySicil) {
        SprintPresentation presentation = presentationRepository.findByTeamIdAndSprintNo(teamId, sprintNo)
                .orElseGet(() -> {
                    SprintPresentation created = new SprintPresentation();
                    created.setTeamId(teamId);
                    created.setSprintNo(sprintNo);
                    created.setCurrentVersion(0);
                    return created;
                });
        presentation.setDateRange(dateRange);
        presentation.setContent(content);
        presentation.setUpdatedBy(updatedBySicil);
        presentation.setCurrentVersion(presentation.getCurrentVersion() + 1);
        SprintPresentation saved = presentationRepository.save(presentation);

        versionRepository.save(new PresentationVersion(null, saved.getId(), saved.getCurrentVersion(),
                content, updatedBySicil, Instant.now()));
        return saved;
    }

    @Override
    public List<PresentationVersion> listVersions(Long presentationId) {
        getById(presentationId);
        return versionRepository.findByPresentationId(presentationId);
    }

    /**
     * GERCEK geri sarma: hedef versiyonu YENI bir surum olarak head'e EKLEMEZ
     * (onceki davranis buydu) - bunun yerine head'in kendisini hedef versiyonun
     * icerigine/numarasina DUSURUR ve hedeften SONRAKI tum surum kayitlarini
     * SILER. "v6'ya donunce v6 yazsin, v7+ kalici olarak gitsin" (bkz. kullanici
     * bildirimi) - versiyon gecmisi bu noktadan sonra KISALIR, geri alinamaz.
     */
    @Override
    @Transactional
    public SprintPresentation rollback(Long presentationId, int version, String updatedBySicil) {
        SprintPresentation presentation = getById(presentationId);
        PresentationVersion target = versionRepository.findByPresentationIdAndVersion(presentationId, version)
                .orElseThrow(() -> new NotFoundException("Versiyon bulunamadi: presentationId=" + presentationId + ", version=" + version));

        presentation.setContent(target.getContent());
        presentation.setCurrentVersion(version);
        presentation.setUpdatedBy(updatedBySicil);
        SprintPresentation saved = presentationRepository.save(presentation);

        versionRepository.deleteByPresentationIdAndVersionGreaterThan(presentationId, version);
        return saved;
    }

    @Override
    public List<SprintPresentation> listLatestPerTeamReadOnly(List<Long> teamIds) {
        return presentationRepository.findLatestPerTeamReadOnly(teamIds);
    }

    @Override
    public PresentationDownloadLog recordDownload(PresentationDownloadLog.DownloadType downloadType, List<Long> teamIds, String downloadedBy) {
        return downloadLogRepository.save(new PresentationDownloadLog(null, downloadType, teamIds, downloadedBy, null));
    }
}
