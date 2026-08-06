package com.aksa.capacityplanner.document.application.service;

import com.aksa.capacityplanner.common.domain.NotFoundException;
import com.aksa.capacityplanner.document.application.port.in.DocumentSummary;
import com.aksa.capacityplanner.document.application.port.in.DocumentUploadResult;
import com.aksa.capacityplanner.document.application.port.in.DocumentUseCase;
import com.aksa.capacityplanner.document.application.port.out.DocumentRepositoryPort;
import com.aksa.capacityplanner.document.application.port.out.DocumentStoragePort;
import com.aksa.capacityplanner.document.application.port.out.DocumentVersionRepositoryPort;
import com.aksa.capacityplanner.document.domain.model.Document;
import com.aksa.capacityplanner.document.domain.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.UUID;

@Service
public class DocumentService implements DocumentUseCase {

    private static final String OBJECT_KEY_PREFIX = "documents/";

    private final DocumentRepositoryPort documentRepositoryPort;
    private final DocumentVersionRepositoryPort documentVersionRepositoryPort;
    private final DocumentStoragePort documentStoragePort;

    public DocumentService(DocumentRepositoryPort documentRepositoryPort,
                            DocumentVersionRepositoryPort documentVersionRepositoryPort,
                            DocumentStoragePort documentStoragePort) {
        this.documentRepositoryPort = documentRepositoryPort;
        this.documentVersionRepositoryPort = documentVersionRepositoryPort;
        this.documentStoragePort = documentStoragePort;
    }

    @Override
    public DocumentUploadResult uploadNewDocument(String name, String originalFilename, String contentType,
                                                    InputStream data, long size, String uploadedBy) {
        Document saved = documentRepositoryPort.save(new Document(null, name, uploadedBy, null));
        DocumentVersion version = storeVersion(saved.getId(), 1, originalFilename, contentType, data, size, uploadedBy);
        return new DocumentUploadResult(saved, version);
    }

    @Override
    public DocumentUploadResult uploadNewVersion(Long documentId, String originalFilename, String contentType,
                                                   InputStream data, long size, String uploadedBy) {
        Document document = documentRepositoryPort.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Dosya bulunamadı: " + documentId));
        int nextVersionNumber = documentVersionRepositoryPort.findLatestByDocumentId(documentId)
                .map(v -> v.getVersionNumber() + 1)
                .orElse(1);
        DocumentVersion version = storeVersion(documentId, nextVersionNumber, originalFilename, contentType, data, size, uploadedBy);
        return new DocumentUploadResult(document, version);
    }

    @Override
    public Page<DocumentSummary> listDocuments(Pageable pageable) {
        return documentRepositoryPort.findAll(pageable).map(document -> {
            DocumentVersion latest = documentVersionRepositoryPort.findLatestByDocumentId(document.getId()).orElse(null);
            int versionCount = documentVersionRepositoryPort.countByDocumentId(document.getId());
            return new DocumentSummary(document, latest, versionCount);
        });
    }

    @Override
    public Page<DocumentVersion> listVersions(Long documentId, Pageable pageable) {
        requireDocument(documentId);
        return documentVersionRepositoryPort.findByDocumentId(documentId, pageable);
    }

    @Override
    public String getLatestDownloadUrl(Long documentId) {
        DocumentVersion latest = documentVersionRepositoryPort.findLatestByDocumentId(documentId)
                .orElseThrow(() -> new NotFoundException("Dosyanın hiç versiyonu yok: " + documentId));
        return documentStoragePort.presignedDownloadUrl(latest.getObjectKey());
    }

    @Override
    public String getVersionDownloadUrl(Long documentId, Long versionId) {
        DocumentVersion version = documentVersionRepositoryPort.findById(versionId)
                .filter(v -> v.getDocumentId().equals(documentId))
                .orElseThrow(() -> new NotFoundException("Versiyon bulunamadı: " + versionId));
        return documentStoragePort.presignedDownloadUrl(version.getObjectKey());
    }

    private DocumentVersion storeVersion(Long documentId, int versionNumber, String originalFilename,
                                          String contentType, InputStream data, long size, String uploadedBy) {
        String objectKey = OBJECT_KEY_PREFIX + UUID.randomUUID() + extensionOf(originalFilename);
        documentStoragePort.store(objectKey, contentType, data, size);
        return documentVersionRepositoryPort.save(new DocumentVersion(
                null, documentId, versionNumber, objectKey, originalFilename, size, uploadedBy, null));
    }

    private void requireDocument(Long documentId) {
        if (documentRepositoryPort.findById(documentId).isEmpty()) {
            throw new NotFoundException("Dosya bulunamadı: " + documentId);
        }
    }

    private String extensionOf(String originalFilename) {
        if (originalFilename == null) return "";
        int dot = originalFilename.lastIndexOf('.');
        return dot >= 0 ? originalFilename.substring(dot) : "";
    }
}
