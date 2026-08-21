package com.aksa.capacityplanner.asset.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * MinIO baglantisi Postgres ile ayni desende hazirlanir
 * (docker-compose'daki "minio" servisi + burada bean/bucket bootstrap).
 * Flyway migration'lari nasil ilk aciliste otomatik uygulanirsa, burada da
 * bucket yoksa acilista otomatik olusturulur.
 */
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class MinioConfig {

    private static final Logger log = LoggerFactory.getLogger(MinioConfig.class);

    @Bean
    public MinioClient minioClient(StorageProperties props) {
        MinioClient client = MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
        ensureBucket(client, props.getBucket());
        return client;
    }

    private void ensureBucket(MinioClient client, String bucket) {
        try {
            boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
                log.info("MinIO bucket '{}' bulunamadi, olusturuldu.", bucket);
            }
        } catch (Exception e) {
            // MinIO su an ayakta degilse uygulamanin geri kalani (DB/cache/vb.) calismaya devam etsin -
            // kapak gorseli yukleme tek kullanimlik/best-effort bir ozellik, kritik yol degil.
            log.warn("MinIO bucket kontrolu/olusturmasi basarisiz oldu ({}). Kapak gorseli yukleme calismayabilir.",
                    e.getMessage());
        }
    }
}
