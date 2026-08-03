package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.port.out.StatusOptionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class StatusOptionPersistenceAdapter implements StatusOptionRepositoryPort {

    private final StatusOptionJpaRepository jpaRepository;

    public StatusOptionPersistenceAdapter(StatusOptionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public StatusOption save(StatusOption statusOption) {
        StatusOptionJpaEntity entity = toEntity(statusOption);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<StatusOption> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<StatusOption> findAvailableForTeam(Long teamId) {
        return jpaRepository.findAvailableForTeam(teamId).stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private StatusOptionJpaEntity toEntity(StatusOption option) {
        StatusOptionJpaEntity entity = new StatusOptionJpaEntity();
        entity.setId(option.getId());
        entity.setTeamId(option.getTeamId());
        entity.setCode(option.getCode());
        entity.setLabel(option.getLabel());
        entity.setCountsAsCompleted(option.isCountsAsCompleted());
        entity.setColorHex(option.getColorHex());
        entity.setSortOrder(option.getSortOrder());
        return entity;
    }

    private StatusOption toDomain(StatusOptionJpaEntity entity) {
        return new StatusOption(entity.getId(), entity.getTeamId(), entity.getCode(), entity.getLabel(),
                entity.isCountsAsCompleted(), entity.getColorHex(), entity.getSortOrder());
    }
}
