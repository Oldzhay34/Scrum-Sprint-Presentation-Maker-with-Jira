package com.aksa.capacityplanner.capacity.usecase;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.in.WorkItemUseCase;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.team.domain.StatusOption;
import com.aksa.capacityplanner.team.port.out.StatusOptionRepositoryPort;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class WorkItemService implements WorkItemUseCase {

    private final WorkItemRepositoryPort repository;
    private final StatusOptionRepositoryPort statusOptionRepository;

    public WorkItemService(WorkItemRepositoryPort repository, StatusOptionRepositoryPort statusOptionRepository) {
        this.repository = repository;
        this.statusOptionRepository = statusOptionRepository;
    }

    @Override
    @CacheEvict(value = "capacity-dashboard", allEntries = true)
    public WorkItem addWorkItem(WorkItem workItem) {
        if (workItem.getAddedDate() == null) {
            workItem.setAddedDate(LocalDate.now());
        }
        return repository.save(workItem);
    }

    @Override
    @CacheEvict(value = "capacity-dashboard", allEntries = true)
    public WorkItem updateWorkItem(Long id, WorkItem workItem) {
        WorkItem existing = getOrThrow(id);
        existing.setTeamMemberId(workItem.getTeamMemberId());
        existing.setTitle(workItem.getTitle());
        existing.setJiraIssueKey(workItem.getJiraIssueKey());
        existing.setPlannedEffortDays(workItem.getPlannedEffortDays());
        existing.setStatusCode(workItem.getStatusCode());
        return repository.save(existing);
    }

    @Override
    @CacheEvict(value = "capacity-dashboard", allEntries = true)
    public WorkItem changeStatus(Long id, String statusCode) {
        WorkItem existing = getOrThrow(id);
        existing.setStatusCode(statusCode);
        boolean completed = statusOptionRepository.findAvailableForTeam(existing.getTeamId()).stream()
                .filter(s -> s.getCode().equals(statusCode))
                .findFirst()
                .map(StatusOption::isCountsAsCompleted)
                .orElse(false);
        existing.setClosedDate(completed ? LocalDate.now() : null);
        return repository.save(existing);
    }

    @Override
    public List<WorkItem> listByTeam(Long teamId) {
        return repository.findByTeamId(teamId);
    }

    @Override
    @CacheEvict(value = "capacity-dashboard", allEntries = true)
    public void deleteWorkItem(Long id) {
        repository.deleteById(id);
    }

    private WorkItem getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Is kalemi bulunamadi: id=" + id));
    }
}
