package com.aksa.capacityplanner.document.domain.model;

import java.time.Instant;

public class DocumentVersion {

    private final Long id;
    private final Long documentId;
    private final int versionNumber;
    private final String objectKey;
    private final String originalFilename;
    private final long fileSize;
    private final String createdBy;
    private final Instant createdAt;

    public DocumentVersion(Long id, Long documentId, int versionNumber, String objectKey,
                            String originalFilename, long fileSize, String createdBy, Instant createdAt) {
        this.id = id;
        this.documentId = documentId;
        this.versionNumber = versionNumber;
        this.objectKey = objectKey;
        this.originalFilename = originalFilename;
        this.fileSize = fileSize;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public int getVersionNumber() {
        return versionNumber;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public long getFileSize() {
        return fileSize;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
