package com.aksa.capacityplanner.team.port.out;

import java.util.List;
import java.util.Set;

public interface TeamSectorOptionRepositoryPort {

    /** Takimin Jira'dan senkronize edilen sektor listesi, alfabetik. */
    List<String> findByTeamId(Long teamId);

    /**
     * Takimin sektor listesini verilenle TAMAMEN degistirir (eskisi silinir) -
     * Jira'daki guncel durumun tek dogruluk kaynagi olmasi icin, her sync'te
     * cagirilir (bkz. JiraSyncProcessor).
     */
    void replaceAll(Long teamId, Set<String> sectorValues);
}
