package com.aksa.capacityplanner.team.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Takima ozgu ek alan tanimi (orn. RPA takiminda "FTE Orani").
 * Deger, TeamMember.customFieldValues icinde fieldKey ile eslesir.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamCustomFieldDefinition {

    private Long id;
    private Long teamId;
    private String fieldKey;
    private String label;
    private CustomFieldType type;
    private boolean required;
    private int sortOrder;
}
