package com.aksa.capacityplanner.document.adapter.out.persistence;

import com.aksa.capacityplanner.document.application.port.out.DocumentRepositoryPort;
import com.aksa.capacityplanner.document.domain.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DocumentPersistenceAdapter implements DocumentRepositoryPort {

    private final DocumentJpaRepository jpaRepository;

    public DocumentPersistenceAdapter(DocumentJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Document save(Document document) {
        DocumentJpaEntity entity = new DocumentJpaEntity();
        entity.setId(document.getId());
        entity.setName(document.getName());
        entity.setCreatedBy(document.getCreatedBy());
        DocumentJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Document> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Page<Document> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(this::toDomain);
    }

    private Document toDomain(DocumentJpaEntity entity) {
        return new Document(entity.getId(), entity.getName(), entity.getCreatedBy(), entity.getCreatedAt());
    }
}
