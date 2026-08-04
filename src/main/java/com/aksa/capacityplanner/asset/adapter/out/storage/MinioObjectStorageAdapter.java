package com.aksa.capacityplanner.asset.adapter.out.storage;

import com.aksa.capacityplanner.asset.config.StorageProperties;
import com.aksa.capacityplanner.asset.port.out.ObjectStoragePort;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Component
public class MinioObjectStorageAdapter implements ObjectStoragePort {

    private static final int PRESIGNED_URL_EXPIRY_DAYS = 7;

    private final MinioClient minioClient;
    private final StorageProperties props;

    public MinioObjectStorageAdapter(MinioClient minioClient, StorageProperties props) {
        this.minioClient = minioClient;
        this.props = props;
    }

    @Override
    public String upload(String keyPrefix, String filename, String contentType, InputStream data, long size) {
        String objectKey = keyPrefix + filename;
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(props.getBucket())
                    .object(objectKey)
                    .stream(data, size, -1)
                    .contentType(contentType)
                    .build());

            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(props.getBucket())
                    .object(objectKey)
                    .expiry(PRESIGNED_URL_EXPIRY_DAYS, TimeUnit.DAYS)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Görsel MinIO'ya yüklenemedi: " + e.getMessage(), e);
        }
    }
}
