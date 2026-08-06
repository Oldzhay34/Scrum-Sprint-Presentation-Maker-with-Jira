package com.aksa.capacityplanner.document.adapter.in.web.dto;

import java.time.Instant;

public record DocumentVersionDto(Long id, Long documentId, int versionNumber, String originalFilename,
                                  long fileSize, String createdBy, Instant createdAt) {
}
