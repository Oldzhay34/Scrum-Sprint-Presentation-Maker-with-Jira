package com.aksa.capacityplanner.presentation.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record PresentationUpsertRequest(@NotNull Long teamId, @NotBlank String sprintNo, String dateRange,
                                         @NotNull Map<String, Object> content) {
}
