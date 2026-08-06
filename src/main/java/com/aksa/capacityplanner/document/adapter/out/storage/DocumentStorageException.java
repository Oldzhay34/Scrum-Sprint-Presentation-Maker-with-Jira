package com.aksa.capacityplanner.document.adapter.out.storage;

/** MinIO/object storage ile konusurken olusan beklenmeyen hatalari sarmalar. */
public class DocumentStorageException extends RuntimeException {
    public DocumentStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
