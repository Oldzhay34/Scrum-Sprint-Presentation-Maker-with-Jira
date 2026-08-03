package com.aksa.capacityplanner.capacity.facade;

import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;
import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.in.CapacityDashboardUseCase;
import com.aksa.capacityplanner.capacity.port.in.CapacityDashboardUseCase.DashboardQuery;
import com.aksa.capacityplanner.capacity.port.in.WorkItemUseCase;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CapacityFacade {

    private final WorkItemUseCase workItemUseCase;
    private final CapacityDashboardUseCase dashboardUseCase;

    public CapacityFacade(WorkItemUseCase workItemUseCase, CapacityDashboardUseCase dashboardUseCase) {
        this.workItemUseCase = workItemUseCase;
        this.dashboardUseCase = dashboardUseCase;
    }

    public WorkItem addWorkItem(WorkItem workItem) {
        return workItemUseCase.addWorkItem(workItem);
    }

    public WorkItem updateWorkItem(Long id, WorkItem workItem) {
        return workItemUseCase.updateWorkItem(id, workItem);
    }

    public WorkItem changeStatus(Long id, String statusCode) {
        return workItemUseCase.changeStatus(id, statusCode);
    }

    public List<WorkItem> listWorkItems(Long teamId) {
        return workItemUseCase.listByTeam(teamId);
    }

    public void deleteWorkItem(Long id) {
        workItemUseCase.deleteWorkItem(id);
    }

    public CapacityDashboard getDashboard(DashboardQuery query) {
        return dashboardUseCase.getDashboard(query);
    }
}
