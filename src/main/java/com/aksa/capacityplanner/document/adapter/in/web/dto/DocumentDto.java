package com.aksa.capacityplanner.document.adapter.in.web.dto;

import java.time.Instant;

public record DocumentDto(Long id, String name, String createdBy, Instant createdAt, int versionCount,
                           Integer latestVersionNumber, String latestOriginalFilename, Long latestFileSize) {
}
