package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import com.aksa.capacityplanner.presentation.domain.SprintPresentation;
import com.aksa.capacityplanner.presentation.port.out.PresentationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class PresentationPersistenceAdapter implements PresentationRepositoryPort {

    private final SprintPresentationJpaRepository jpaRepository;
    private final SprintPresentationReadOnlyJpaRepository readOnlyJpaRepository;

    public PresentationPersistenceAdapter(SprintPresentationJpaRepository jpaRepository,
                                           SprintPresentationReadOnlyJpaRepository readOnlyJpaRepository) {
        this.jpaRepository = jpaRepository;
        this.readOnlyJpaRepository = readOnlyJpaRepository;
    }

    @Override
    public SprintPresentation save(SprintPresentation presentation) {
        SprintPresentationJpaEntity entity = toEntity(presentation);
        // saveAndFlush KULLANILIYOR: save() merge-only oldugu icin @UpdateTimestamp
        // henuz flush edilmeden donen entity'de updatedAt null gorunuyordu.
        SprintPresentationJpaEntity saved = jpaRepository.saveAndFlush(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<SprintPresentation> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<SprintPresentation> findByTeamIdAndSprintNo(Long teamId, String sprintNo) {
        return jpaRepository.findByTeamIdAndSprintNo(teamId, sprintNo).map(this::toDomain);
    }

    @Override
    public List<SprintPresentation> findByTeamId(Long teamId) {
        return jpaRepository.findByTeamId(teamId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<SprintPresentation> findByIdReadOnly(Long id) {
        return readOnlyJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<SprintPresentation> findByTeamIdReadOnly(Long teamId) {
        return readOnlyJpaRepository.findByTeamId(teamId).stream().map(this::toDomain).toList();
    }

    private SprintPresentation toDomain(SprintPresentationReadOnlyJpaEntity entity) {
        return new SprintPresentation(entity.getId(), entity.getTeamId(), entity.getSprintNo(), entity.getDateRange(),
                entity.getContent(), entity.getCurrentVersion(), entity.getUpdatedBy(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }

    private SprintPresentationJpaEntity toEntity(SprintPresentation presentation) {
        SprintPresentationJpaEntity entity = new SprintPresentationJpaEntity();
        entity.setId(presentation.getId());
        entity.setTeamId(presentation.getTeamId());
        entity.setSprintNo(presentation.getSprintNo());
        entity.setDateRange(presentation.getDateRange());
        entity.setContent(presentation.getContent());
        entity.setCurrentVersion(presentation.getCurrentVersion());
        entity.setUpdatedBy(presentation.getUpdatedBy());
        return entity;
    }

    private SprintPresentation toDomain(SprintPresentationJpaEntity entity) {
        return new SprintPresentation(entity.getId(), entity.getTeamId(), entity.getSprintNo(), entity.getDateRange(),
                entity.getContent(), entity.getCurrentVersion(), entity.getUpdatedBy(),
                entity.getCreatedAt(), entity.getUpdatedAt());
    }
}
