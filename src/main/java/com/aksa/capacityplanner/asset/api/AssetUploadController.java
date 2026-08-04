package com.aksa.capacityplanner.asset.api;

import com.aksa.capacityplanner.asset.api.dto.AssetUploadResponse;
import com.aksa.capacityplanner.asset.port.out.ObjectStoragePort;
import com.aksa.capacityplanner.common.domain.DomainValidationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.UUID;

/**
 * Kapak gorseli gibi tek kullanimlik gorsellerin MinIO'ya yuklendigi endpoint.
 * Hicbir sey veritabanina kaydedilmez - istek suresince yasar, presigned URL
 * aninda doner (bkz. ObjectStoragePort / MinioObjectStorageAdapter).
 */
@RestController
@RequestMapping("/api/assets")
public class AssetUploadController {

    private final ObjectStoragePort objectStoragePort;

    public AssetUploadController(ObjectStoragePort objectStoragePort) {
        this.objectStoragePort = objectStoragePort;
    }

    @PostMapping("/cover-image")
    public AssetUploadResponse uploadCoverImage(@RequestParam("file") MultipartFile file) {
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null || !contentType.startsWith("image/")) {
            throw new DomainValidationException("Sadece görsel dosyaları yüklenebilir.");
        }

        String extension = extensionOf(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;

        try {
            String url = objectStoragePort.upload("cover/", filename, contentType, file.getInputStream(), file.getSize());
            return new AssetUploadResponse(url);
        } catch (IOException e) {
            throw new UncheckedIOException("Yüklenen dosya okunamadı.", e);
        }
    }

    private String extensionOf(String originalFilename) {
        if (originalFilename == null) return "";
        int dot = originalFilename.lastIndexOf('.');
        return dot >= 0 ? originalFilename.substring(dot) : "";
    }
}
