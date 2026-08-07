package com.aksa.capacityplanner.presentation.api.dto;

import java.time.Instant;

public record PresentationVersionDto(int version, String updatedBy, Instant updatedAt) {
}
