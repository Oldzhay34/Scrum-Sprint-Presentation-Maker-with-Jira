package com.aksa.capacityplanner.document.adapter.out.storage;

import com.aksa.capacityplanner.asset.config.StorageProperties;
import com.aksa.capacityplanner.document.application.port.out.DocumentStoragePort;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/**
 * Kalici dosyalar (orn. .pptx sunumlar) icin MinIO adapter'i. Kapak gorseli
 * icin kullanilan asset.adapter.out.storage.MinioObjectStorageAdapter'dan farkli
 * olarak upload aninda URL donmez - indirme icin ayri, kisa omurlu (15 dk)
 * bir pre-signed URL uretilir (bkz. DocumentStoragePort).
 */
@Component
public class MinioDocumentStorageAdapter implements DocumentStoragePort {

    private static final int DOWNLOAD_URL_EXPIRY_MINUTES = 15;

    private final MinioClient minioClient;
    private final StorageProperties props;

    public MinioDocumentStorageAdapter(MinioClient minioClient, StorageProperties props) {
        this.minioClient = minioClient;
        this.props = props;
    }

    @Override
    public void store(String objectKey, String contentType, InputStream data, long size) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(objectKey)
                    .stream(data, size, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new DocumentStorageException("Dosya MinIO'ya yüklenemedi: " + e.getMessage(), e);
        }
    }

    @Override
    public String presignedDownloadUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(props.getBucket())
                    .object(objectKey)
                    .expiry(DOWNLOAD_URL_EXPIRY_MINUTES, TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            throw new DocumentStorageException("İndirme linki üretilemedi: " + e.getMessage(), e);
        }
    }
}
