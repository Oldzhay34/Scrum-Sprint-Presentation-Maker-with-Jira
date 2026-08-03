package com.aksa.capacityplanner.capacity.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkItemJpaRepository extends JpaRepository<WorkItemJpaEntity, Long> {
    List<WorkItemJpaEntity> findByTeamId(Long teamId);

    Optional<WorkItemJpaEntity> findByJiraIssueKey(String jiraIssueKey);
}
