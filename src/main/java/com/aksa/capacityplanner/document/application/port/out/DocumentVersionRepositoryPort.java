package com.aksa.capacityplanner.document.application.port.out;

import com.aksa.capacityplanner.document.domain.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface DocumentVersionRepositoryPort {

    DocumentVersion save(DocumentVersion version);

    Optional<DocumentVersion> findById(Long id);

    Page<DocumentVersion> findByDocumentId(Long documentId, Pageable pageable);

    Optional<DocumentVersion> findLatestByDocumentId(Long documentId);

    int countByDocumentId(Long documentId);
}
