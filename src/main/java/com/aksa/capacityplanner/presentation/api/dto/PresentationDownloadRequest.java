package com.aksa.capacityplanner.presentation.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record PresentationDownloadRequest(@NotNull String downloadType, @NotEmpty List<Long> teamIds) {
}
