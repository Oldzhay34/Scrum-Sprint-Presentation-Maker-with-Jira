package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import com.aksa.capacityplanner.presentation.domain.PresentationVersion;
import com.aksa.capacityplanner.presentation.port.out.PresentationVersionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class PresentationVersionPersistenceAdapter implements PresentationVersionRepositoryPort {

    private final PresentationVersionJpaRepository jpaRepository;

    public PresentationVersionPersistenceAdapter(PresentationVersionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public PresentationVersion save(PresentationVersion version) {
        PresentationVersionJpaEntity entity = toEntity(version);
        PresentationVersionJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<PresentationVersion> findByPresentationId(Long presentationId) {
        return jpaRepository.findByPresentationIdOrderByVersionDesc(presentationId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<PresentationVersion> findByPresentationIdAndVersion(Long presentationId, int version) {
        return jpaRepository.findByPresentationIdAndVersion(presentationId, version).map(this::toDomain);
    }

    @Override
    public void deleteByPresentationIdAndVersionGreaterThan(Long presentationId, int version) {
        jpaRepository.deleteByPresentationIdAndVersionGreaterThan(presentationId, version);
    }

    private PresentationVersionJpaEntity toEntity(PresentationVersion version) {
        PresentationVersionJpaEntity entity = new PresentationVersionJpaEntity();
        entity.setId(version.getId());
        entity.setPresentationId(version.getPresentationId());
        entity.setVersion(version.getVersion());
        entity.setContent(version.getContent());
        entity.setUpdatedBy(version.getUpdatedBy());
        return entity;
    }

    private PresentationVersion toDomain(PresentationVersionJpaEntity entity) {
        return new PresentationVersion(entity.getId(), entity.getPresentationId(), entity.getVersion(),
                entity.getContent(), entity.getUpdatedBy(), entity.getUpdatedAt());
    }
}
