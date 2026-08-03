package com.aksa.capacityplanner.team.api.dto;

import java.math.BigDecimal;

public record TeamDto(Long id, String name, String description,
                       BigDecimal maintenanceAllocationPercent, BigDecimal defaultTargetWorkDays) {
}
