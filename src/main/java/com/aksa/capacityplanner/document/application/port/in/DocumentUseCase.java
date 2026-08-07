package com.aksa.capacityplanner.document.application.port.in;

import com.aksa.capacityplanner.document.domain.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.InputStream;

public interface DocumentUseCase {

    DocumentUploadResult uploadNewDocument(String name, String originalFilename, String contentType,
                                            InputStream data, long size, String uploadedBy);

    DocumentUploadResult uploadNewVersion(Long documentId, String originalFilename, String contentType,
                                           InputStream data, long size, String uploadedBy);

    Page<DocumentSummary> listDocuments(Pageable pageable);

    Page<DocumentVersion> listVersions(Long documentId, Pageable pageable);

    String getLatestDownloadUrl(Long documentId);

    String getVersionDownloadUrl(Long documentId, Long versionId);
}
