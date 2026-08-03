package com.aksa.capacityplanner.team.api.dto;

public record StatusOptionDto(Long id, Long teamId, String code, String label,
                               boolean countsAsCompleted, String colorHex, int sortOrder) {
}
