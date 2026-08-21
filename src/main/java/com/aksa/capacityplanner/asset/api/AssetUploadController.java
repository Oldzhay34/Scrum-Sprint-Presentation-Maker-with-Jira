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
        return uploadImage(file, "cover/");
    }

    /**
     * Kapak slaydinin TAM ZEMIN arka plani - "Kapak Görseli" (yukarida) ile AYNI
     * mekanizma ama AYRI bir katman: cover_bg (Kapak Görseli) her zaman slaydin
     * TAMAMINI kaplayan bir gorsel oldugu icin, bu gorselin SEFFAF bolgelerinden
     * (varsayilan Aksa gorselinde soldaki bosluk gibi) gorunecek ALT katmandir
     * (bkz. frontend SlideCanvas.jsx "cov-page-bg", kullanici bildirimi,
     * 2026-08-17: "bu sayfaya sunumun arka planını yükleme alanı yap").
     */
    @PostMapping("/cover-background")
    public AssetUploadResponse uploadCoverBackground(@RequestParam("file") MultipartFile file) {
        return uploadImage(file, "cover-bg/");
    }

    /**
     * Kapasite Dashboard'un 4. adimindaki "Velocity & Burndown" ekran goruntuleri -
     * PO'nun Jira'dan aldigi Burndown Chart ve Velocity Chart gorselleri (bkz.
     * kullanici bildirimi 2026-08-20: "iki tane png ve benzeri formatlarında
     * yükleme yeri yap"). Diger asset upload'lariyla AYNI best-effort mekanizma -
     * hicbir sey veritabanina kaydedilmez, gercek veri (base64) frontend'de
     * FileReader ile aninda kullanilir; bu yukleme sadece MinIO'ya kalici bir
     * kopya birakmak icindir.
     */
    @PostMapping("/burndown-chart")
    public AssetUploadResponse uploadBurndownChart(@RequestParam("file") MultipartFile file) {
        return uploadImage(file, "burndown/");
    }

    @PostMapping("/velocity-chart")
    public AssetUploadResponse uploadVelocityChart(@RequestParam("file") MultipartFile file) {
        return uploadImage(file, "velocity/");
    }

    private AssetUploadResponse uploadImage(MultipartFile file, String prefix) {
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null || !contentType.startsWith("image/")) {
            throw new DomainValidationException("Sadece görsel dosyaları yüklenebilir.");
        }

        String extension = extensionOf(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;

        try {
            String url = objectStoragePort.upload(prefix, filename, contentType, file.getInputStream(), file.getSize());
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
