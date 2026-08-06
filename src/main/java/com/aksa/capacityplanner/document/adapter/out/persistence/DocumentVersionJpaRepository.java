package com.aksa.capacityplanner.document.adapter.out.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentVersionJpaRepository extends JpaRepository<DocumentVersionJpaEntity, Long> {

    Page<DocumentVersionJpaEntity> findByDocumentId(Long documentId, Pageable pageable);

    Optional<DocumentVersionJpaEntity> findFirstByDocumentIdOrderByVersionNumberDesc(Long documentId);

    int countByDocumentId(Long documentId);
}
