package com.aksa.capacityplanner.document.application.port.in;

import com.aksa.capacityplanner.document.domain.model.Document;
import com.aksa.capacityplanner.document.domain.model.DocumentVersion;

public record DocumentUploadResult(Document document, DocumentVersion version) {
}
