package com.aksa.capacityplanner.document.application.port.in;

import com.aksa.capacityplanner.document.domain.model.Document;
import com.aksa.capacityplanner.document.domain.model.DocumentVersion;

/** Liste ekranı için: dosyanın kendisi + sadece en güncel versiyonu (geçmiş versiyonlar ayrı endpoint'ten çekilir). */
public record DocumentSummary(Document document, DocumentVersion latestVersion, int versionCount) {
}
