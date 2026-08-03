package com.aksa.capacityplanner.team.api.dto;

import com.aksa.capacityplanner.team.domain.CustomFieldType;

public record CustomFieldDefinitionDto(Long id, Long teamId, String fieldKey, String label,
                                        CustomFieldType type, boolean required, int sortOrder) {
}
