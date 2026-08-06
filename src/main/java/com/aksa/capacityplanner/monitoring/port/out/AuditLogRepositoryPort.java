package com.aksa.capacityplanner.monitoring.port.out;

import com.aksa.capacityplanner.monitoring.domain.ActionOption;
import com.aksa.capacityplanner.monitoring.domain.ActorOption;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import com.aksa.capacityplanner.monitoring.domain.AuditLogPage;
import com.aksa.capacityplanner.monitoring.domain.AuditSummary;

import java.util.List;

public interface AuditLogRepositoryPort {

    /** Sadece INSERT - bu port'ta guncelleme/silme metodu bilerek YOK (bkz. V6 migration'daki DB trigger). */
    AuditLog save(AuditLog entry);

    AuditLogPage search(AuditLogFilter filter, int page, int size);

    AuditSummary summary();

    List<ActorOption> listDistinctActors();

    List<ActionOption> listDistinctActions();
}
