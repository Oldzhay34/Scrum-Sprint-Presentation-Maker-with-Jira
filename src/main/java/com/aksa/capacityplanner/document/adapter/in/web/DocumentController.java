package com.aksa.capacityplanner.document.adapter.in.web;

import com.aksa.capacityplanner.common.domain.DomainValidationException;
import com.aksa.capacityplanner.document.adapter.in.web.dto.DocumentDto;
import com.aksa.capacityplanner.document.adapter.in.web.dto.DocumentUploadResponse;
import com.aksa.capacityplanner.document.adapter.in.web.dto.DocumentVersionDto;
import com.aksa.capacityplanner.document.adapter.in.web.dto.DownloadUrlResponse;
import com.aksa.capacityplanner.document.application.port.in.DocumentSummary;
import com.aksa.capacityplanner.document.application.port.in.DocumentUploadResult;
import com.aksa.capacityplanner.document.application.port.in.DocumentUseCase;
import com.aksa.capacityplanner.document.domain.model.DocumentVersion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;

/**
 * Kalici sunum (.pptx) yukleme/versiyonlama/indirme uc noktalari. Dosyanin kendisi
 * MinIO'da, metadata (isim, versiyon, boyut) Postgres'te tutulur (bkz. DocumentUseCase).
 * Indirme dogrudan backend'ten stream edilmez - kisa omurlu bir pre-signed URL doner,
 * client dosyayi MinIO'dan indirir.
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final String PPTX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.presentationml.presentation";

    private final DocumentUseCase documentUseCase;

    public DocumentController(DocumentUseCase documentUseCase) {
        this.documentUseCase = documentUseCase;
    }

    @PostMapping
    public DocumentUploadResponse uploadDocument(@RequestParam("name") String name,
                                                  @RequestParam("file") MultipartFile file,
                                                  Authentication authentication) {
        if (name == null || name.isBlank()) {
            throw new DomainValidationException("Dosya adı zorunludur.");
        }
        validatePptx(file);
        try {
            DocumentUploadResult result = documentUseCase.uploadNewDocument(
                    name, file.getOriginalFilename(), file.getContentType(),
                    file.getInputStream(), file.getSize(), authentication.getName());
            return toUploadResponse(result);
        } catch (IOException e) {
            throw new UncheckedIOException("Yüklenen dosya okunamadı.", e);
        }
    }

    @PostMapping("/{id}/versions")
    public DocumentUploadResponse uploadNewVersion(@PathVariable Long id,
                                                     @RequestParam("file") MultipartFile file,
                                                     Authentication authentication) {
        validatePptx(file);
        try {
            DocumentUploadResult result = documentUseCase.uploadNewVersion(
                    id, file.getOriginalFilename(), file.getContentType(),
                    file.getInputStream(), file.getSize(), authentication.getName());
            return toUploadResponse(result);
        } catch (IOException e) {
            throw new UncheckedIOException("Yüklenen dosya okunamadı.", e);
        }
    }

    @GetMapping
    public Page<DocumentDto> listDocuments(Pageable pageable) {
        return documentUseCase.listDocuments(pageable).map(this::toDto);
    }

    @GetMapping("/{id}/versions")
    public Page<DocumentVersionDto> listVersions(@PathVariable Long id, Pageable pageable) {
        return documentUseCase.listVersions(id, pageable).map(this::toDto);
    }

    @GetMapping("/{id}/download-url")
    public DownloadUrlResponse latestDownloadUrl(@PathVariable Long id) {
        return new DownloadUrlResponse(documentUseCase.getLatestDownloadUrl(id));
    }

    @GetMapping("/{id}/versions/{versionId}/download-url")
    public DownloadUrlResponse versionDownloadUrl(@PathVariable Long id, @PathVariable Long versionId) {
        return new DownloadUrlResponse(documentUseCase.getVersionDownloadUrl(id, versionId));
    }

    private void validatePptx(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new DomainValidationException("Dosya boş olamaz.");
        }
        String filename = file.getOriginalFilename();
        boolean pptxExtension = filename != null && filename.toLowerCase().endsWith(".pptx");
        boolean pptxContentType = PPTX_CONTENT_TYPE.equals(file.getContentType());
        if (!pptxExtension && !pptxContentType) {
            throw new DomainValidationException("Sadece .pptx dosyaları yüklenebilir.");
        }
    }

    private DocumentUploadResponse toUploadResponse(DocumentUploadResult result) {
        return new DocumentUploadResponse(result.document().getId(), result.document().getName(), toDto(result.version()));
    }

    private DocumentDto toDto(DocumentSummary summary) {
        DocumentVersion latest = summary.latestVersion();
        return new DocumentDto(
                summary.document().getId(),
                summary.document().getName(),
                summary.document().getCreatedBy(),
                summary.document().getCreatedAt(),
                summary.versionCount(),
                latest != null ? latest.getVersionNumber() : null,
                latest != null ? latest.getOriginalFilename() : null,
                latest != null ? latest.getFileSize() : null);
    }

    private DocumentVersionDto toDto(DocumentVersion version) {
        return new DocumentVersionDto(version.getId(), version.getDocumentId(), version.getVersionNumber(),
                version.getOriginalFilename(), version.getFileSize(), version.getCreatedBy(), version.getCreatedAt());
    }
}
