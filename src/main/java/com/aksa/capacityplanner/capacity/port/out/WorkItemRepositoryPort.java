package com.aksa.capacityplanner.capacity.port.out;

import com.aksa.capacityplanner.capacity.domain.WorkItem;

import java.util.List;
import java.util.Optional;

public interface WorkItemRepositoryPort {
    WorkItem save(WorkItem workItem);

    Optional<WorkItem> findById(Long id);

    List<WorkItem> findByTeamId(Long teamId);

    Optional<WorkItem> findByJiraIssueKey(String jiraIssueKey);

    void deleteById(Long id);
}
