package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.domain.TeamCustomFieldDefinition;
import com.aksa.capacityplanner.team.port.out.TeamCustomFieldDefinitionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TeamCustomFieldDefinitionPersistenceAdapter implements TeamCustomFieldDefinitionRepositoryPort {

    private final TeamCustomFieldDefinitionJpaRepository jpaRepository;

    public TeamCustomFieldDefinitionPersistenceAdapter(TeamCustomFieldDefinitionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public TeamCustomFieldDefinition save(TeamCustomFieldDefinition definition) {
        TeamCustomFieldDefinitionJpaEntity entity = toEntity(definition);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public List<TeamCustomFieldDefinition> findByTeamId(Long teamId) {
        return jpaRepository.findByTeamId(teamId).stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private TeamCustomFieldDefinitionJpaEntity toEntity(TeamCustomFieldDefinition definition) {
        TeamCustomFieldDefinitionJpaEntity entity = new TeamCustomFieldDefinitionJpaEntity();
        entity.setId(definition.getId());
        entity.setTeamId(definition.getTeamId());
        entity.setFieldKey(definition.getFieldKey());
        entity.setLabel(definition.getLabel());
        entity.setType(definition.getType());
        entity.setRequired(definition.isRequired());
        entity.setSortOrder(definition.getSortOrder());
        return entity;
    }

    private TeamCustomFieldDefinition toDomain(TeamCustomFieldDefinitionJpaEntity entity) {
        return new TeamCustomFieldDefinition(entity.getId(), entity.getTeamId(), entity.getFieldKey(),
                entity.getLabel(), entity.getType(), entity.isRequired(), entity.getSortOrder());
    }
}
