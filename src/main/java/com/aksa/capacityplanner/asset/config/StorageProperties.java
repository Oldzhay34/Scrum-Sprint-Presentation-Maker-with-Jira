package com.aksa.capacityplanner.asset.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * MinIO (S3 uyumlu object storage) baglanti ayarlari (.env / application.yml: MINIO_*).
 * Su an tek kullaniclik kapak gorseli yuklemesi icin kullanilir - kalici bir
 * asset kaydi/DB tablosu yok, sadece bucket'a yaz + presigned URL uret.
 */
@ConfigurationProperties(prefix = "app.storage.minio")
public class StorageProperties {

    private String endpoint = "http://localhost:9000";
    private String accessKey = "capacity_planner";
    private String secretKey = "capacity_planner";
    private String bucket = "capacity-planner-assets";

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }
}
