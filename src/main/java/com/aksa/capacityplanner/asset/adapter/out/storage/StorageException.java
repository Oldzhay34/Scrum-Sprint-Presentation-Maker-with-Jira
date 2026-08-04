package com.aksa.capacityplanner.asset.adapter.out.storage;

/** MinIO/object storage ile konusurken olusan beklenmeyen hatalari sarmalar. */
public class StorageException extends RuntimeException {
    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
