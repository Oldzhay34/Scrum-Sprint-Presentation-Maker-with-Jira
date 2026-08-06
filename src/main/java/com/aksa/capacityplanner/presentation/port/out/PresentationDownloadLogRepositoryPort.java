package com.aksa.capacityplanner.presentation.port.out;

import com.aksa.capacityplanner.presentation.domain.PresentationDownloadLog;

public interface PresentationDownloadLogRepositoryPort {
    PresentationDownloadLog save(PresentationDownloadLog log);
}
