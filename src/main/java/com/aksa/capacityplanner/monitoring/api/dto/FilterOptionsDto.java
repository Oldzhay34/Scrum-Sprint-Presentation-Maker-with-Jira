package com.aksa.capacityplanner.monitoring.api.dto;

import com.aksa.capacityplanner.monitoring.domain.ActionOption;
import com.aksa.capacityplanner.monitoring.domain.ActorOption;

import java.util.List;
import java.util.Map;

public record FilterOptionsDto(List<ActorOption> actors, List<ActionOption> actions, Map<Long, String> teams) {
}
