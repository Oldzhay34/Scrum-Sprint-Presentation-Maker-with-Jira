package com.aksa.capacityplanner.presentation.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record PresentationUpdateInPlaceRequest(String dateRange, @NotNull Map<String, Object> content) {
}
