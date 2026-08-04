package com.aksa.capacityplanner.asset.port.out;

import java.io.InputStream;

/**
 * Kalici olmayan (tek kullanimlik) dosya yukleme cikis portu. Su an tek adapter'i
 * MinIO'dur (bkz. MinioObjectStorageAdapter); ileride kalici bir asset yonetimi
 * gerekirse bu port degismeden yeni bir domain/persistence katmani eklenebilir.
 */
public interface ObjectStoragePort {

    /**
     * Veriyi bucket'a yazar ve dogrudan erisilebilir (presigned) bir URL doner.
     */
    String upload(String keyPrefix, String filename, String contentType, InputStream data, long size);
}
