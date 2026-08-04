package com.aksa.capacityplanner.team.api.dto;

import com.aksa.capacityplanner.team.domain.TeamType;

import java.math.BigDecimal;

public record TeamDto(Long id, String name, String description,
                       BigDecimal maintenanceAllocationPercent, BigDecimal defaultTargetWorkDays,
                       TeamType teamType) {
}
