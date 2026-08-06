package com.aksa.capacityplanner.presentation.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresentationDownloadLog {

    private Long id;
    private DownloadType downloadType;
    private List<Long> teamIds;
    private String downloadedBy;
    private Instant downloadedAt;

    public enum DownloadType {
        INDIVIDUAL, BATCH
    }
}
