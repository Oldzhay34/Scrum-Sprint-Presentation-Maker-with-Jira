package com.aksa.capacityplanner.presentation.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresentationVersion {

    private Long id;
    private Long presentationId;
    private int version;
    private Map<String, Object> content;
    private String updatedBy;
    private Instant updatedAt;
}
