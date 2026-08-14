package com.aksa.capacityplanner.capacity.api;

import com.aksa.capacityplanner.capacity.api.dto.CapacityDashboardDto;
import com.aksa.capacityplanner.capacity.api.dto.MemberCapacityMetricsDto;
import com.aksa.capacityplanner.capacity.domain.CapacityDashboard;
import com.aksa.capacityplanner.capacity.domain.MemberCapacityMetrics;
import org.springframework.stereotype.Component;

@Component
public class CapacityDashboardMapper {

    public CapacityDashboardDto toDto(CapacityDashboard dashboard) {
        return new CapacityDashboardDto(
                dashboard.getTeamId(), dashboard.getPeriodStart(), dashboard.getPeriodEnd(), dashboard.getReportDate(),
                dashboard.getTotalPlannedEffort(), dashboard.getCompletedEffort(), dashboard.getRemainingEffort(),
                dashboard.getRemainingCapacity(), dashboard.getMaintainedOccupancyPercent(), dashboard.getCapacityGap(),
                dashboard.getPeriodClosedEffort(), dashboard.getNewlyAddedEffort(), dashboard.getNetChange(),
                dashboard.getOverallRiskLevel(),
                dashboard.getMemberMetrics().stream().map(this::toDto).toList());
    }

    private MemberCapacityMetricsDto toDto(MemberCapacityMetrics m) {
        return new MemberCapacityMetricsDto(m.getTeamMemberId(), m.getFullName(), m.getRole(), m.getAvatarUrl(),
                m.getTotalPlannedEffort(), m.getCompletedEffort(), m.getRemainingEffort(),
                m.getRawRemainingCapacity(), m.getMaintainedCapacity(), m.getMaintenanceAllocationPercent(),
                m.getOccupancyPercent(), m.getRiskLevel());
    }
}
