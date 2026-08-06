package com.aksa.capacityplanner.document.domain.model;

import java.time.Instant;

public class Document {

    private final Long id;
    private final String name;
    private final String createdBy;
    private final Instant createdAt;

    public Document(Long id, String name, String createdBy, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
