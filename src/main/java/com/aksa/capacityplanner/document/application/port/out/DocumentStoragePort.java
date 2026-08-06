package com.aksa.capacityplanner.document.application.port.out;

import java.io.InputStream;

/**
 * Kalici dosya (orn. .pptx) depolama cikis portu. Object storage'a (MinIO/S3) yazar;
 * indirme icin kisa omurlu bir pre-signed URL uretir - dosya backend uzerinden
 * stream edilmez, client dogrudan storage'dan indirir.
 */
public interface DocumentStoragePort {

    void store(String objectKey, String contentType, InputStream data, long size);

    String presignedDownloadUrl(String objectKey);
}
