package com.aksa.capacityplanner.capacity.port.in;

import com.aksa.capacityplanner.capacity.domain.WorkItem;

import java.util.List;

public interface WorkItemUseCase {
    WorkItem addWorkItem(WorkItem workItem);

    WorkItem updateWorkItem(Long id, WorkItem workItem);

    WorkItem changeStatus(Long id, String statusCode);

    List<WorkItem> listByTeam(Long teamId);

    void deleteWorkItem(Long id);
}
