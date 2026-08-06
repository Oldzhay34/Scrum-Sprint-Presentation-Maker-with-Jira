package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import com.aksa.capacityplanner.presentation.domain.PresentationDownloadLog;
import com.aksa.capacityplanner.presentation.port.out.PresentationDownloadLogRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.HashSet;

@Component
public class PresentationDownloadLogPersistenceAdapter implements PresentationDownloadLogRepositoryPort {

    private final PresentationDownloadLogJpaRepository jpaRepository;

    public PresentationDownloadLogPersistenceAdapter(PresentationDownloadLogJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PresentationDownloadLog save(PresentationDownloadLog log) {
        PresentationDownloadLogJpaEntity entity = new PresentationDownloadLogJpaEntity();
        entity.setDownloadType(log.getDownloadType().name());
        entity.setTeamIds(new HashSet<>(log.getTeamIds()));
        entity.setDownloadedBy(log.getDownloadedBy());
        PresentationDownloadLogJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private PresentationDownloadLog toDomain(PresentationDownloadLogJpaEntity entity) {
        return new PresentationDownloadLog(entity.getId(),
                PresentationDownloadLog.DownloadType.valueOf(entity.getDownloadType()),
                entity.getTeamIds().stream().toList(), entity.getDownloadedBy(), entity.getDownloadedAt());
    }
}
