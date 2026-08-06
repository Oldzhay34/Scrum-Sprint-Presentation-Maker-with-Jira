package com.aksa.capacityplanner.document.application.port.out;

import com.aksa.capacityplanner.document.domain.model.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface DocumentRepositoryPort {

    Document save(Document document);

    Optional<Document> findById(Long id);

    Page<Document> findAll(Pageable pageable);
}
