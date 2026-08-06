package com.aksa.capacityplanner.document.adapter.out.persistence;

import com.aksa.capacityplanner.document.application.port.out.DocumentVersionRepositoryPort;
import com.aksa.capacityplanner.document.domain.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DocumentVersionPersistenceAdapter implements DocumentVersionRepositoryPort {

    private final DocumentVersionJpaRepository jpaRepository;

    public DocumentVersionPersistenceAdapter(DocumentVersionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public DocumentVersion save(DocumentVersion version) {
        DocumentVersionJpaEntity entity = new DocumentVersionJpaEntity();
        entity.setId(version.getId());
        entity.setDocumentId(version.getDocumentId());
        entity.setVersionNumber(version.getVersionNumber());
        entity.setObjectKey(version.getObjectKey());
        entity.setOriginalFilename(version.getOriginalFilename());
        entity.setFileSize(version.getFileSize());
        entity.setCreatedBy(version.getCreatedBy());
        DocumentVersionJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<DocumentVersion> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Page<DocumentVersion> findByDocumentId(Long documentId, Pageable pageable) {
        return jpaRepository.findByDocumentId(documentId, pageable).map(this::toDomain);
    }

    @Override
    public Optional<DocumentVersion> findLatestByDocumentId(Long documentId) {
        return jpaRepository.findFirstByDocumentIdOrderByVersionNumberDesc(documentId).map(this::toDomain);
    }

    @Override
    public int countByDocumentId(Long documentId) {
        return jpaRepository.countByDocumentId(documentId);
    }

    private DocumentVersion toDomain(DocumentVersionJpaEntity entity) {
        return new DocumentVersion(entity.getId(), entity.getDocumentId(), entity.getVersionNumber(),
                entity.getObjectKey(), entity.getOriginalFilename(), entity.getFileSize(),
                entity.getCreatedBy(), entity.getCreatedAt());
    }
}
