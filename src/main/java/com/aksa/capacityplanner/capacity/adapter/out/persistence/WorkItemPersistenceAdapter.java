package com.aksa.capacityplanner.capacity.adapter.out.persistence;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class WorkItemPersistenceAdapter implements WorkItemRepositoryPort {

    private final WorkItemJpaRepository jpaRepository;

    public WorkItemPersistenceAdapter(WorkItemJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public WorkItem save(WorkItem workItem) {
        return toDomain(jpaRepository.save(toEntity(workItem)));
    }

    @Override
    public Optional<WorkItem> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<WorkItem> findByTeamId(Long teamId) {
        return jpaRepository.findByTeamId(teamId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<WorkItem> findByJiraIssueKey(String jiraIssueKey) {
        return jpaRepository.findByJiraIssueKey(jiraIssueKey).map(this::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    private WorkItemJpaEntity toEntity(WorkItem item) {
        WorkItemJpaEntity entity = new WorkItemJpaEntity();
        entity.setId(item.getId());
        entity.setTeamId(item.getTeamId());
        entity.setTeamMemberId(item.getTeamMemberId());
        entity.setTitle(item.getTitle());
        entity.setJiraIssueKey(item.getJiraIssueKey());
        entity.setPlannedEffortDays(item.getPlannedEffortDays());
        entity.setStatusCode(item.getStatusCode());
        entity.setSource(item.getSource());
        entity.setAddedDate(item.getAddedDate());
        entity.setClosedDate(item.getClosedDate());
        entity.setFlagged(item.isFlagged());
        entity.setSector(item.getSector());
        entity.setPriority(item.getPriority());
        entity.setSprintName(item.getSprintName());
        entity.setActiveSprint(item.isActiveSprint());
        entity.setSprintStartDate(item.getSprintStartDate());
        entity.setSprintEndDate(item.getSprintEndDate());
        entity.setPreviousSprint(item.isPreviousSprint());
        entity.setIssueType(item.getIssueType());
        entity.setParentKey(item.getParentKey());
        entity.setParentTitle(item.getParentTitle());
        entity.setParentLabels(item.getParentLabels());
        return entity;
    }

    private WorkItem toDomain(WorkItemJpaEntity entity) {
        return new WorkItem(entity.getId(), entity.getTeamId(), entity.getTeamMemberId(), entity.getTitle(),
                entity.getJiraIssueKey(), entity.getPlannedEffortDays(), entity.getStatusCode(),
                entity.getSource(), entity.getAddedDate(), entity.getClosedDate(),
                entity.isFlagged(), entity.getSector(), entity.getPriority(),
                entity.getSprintName(), entity.isActiveSprint(),
                entity.getSprintStartDate(), entity.getSprintEndDate(),
                entity.isPreviousSprint(), entity.getIssueType(),
                entity.getParentKey(), entity.getParentTitle(), entity.getParentLabels());
    }
}
