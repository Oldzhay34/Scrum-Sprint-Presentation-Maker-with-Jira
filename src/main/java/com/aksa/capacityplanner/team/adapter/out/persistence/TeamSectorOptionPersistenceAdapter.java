package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.port.out.TeamSectorOptionRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Component
public class TeamSectorOptionPersistenceAdapter implements TeamSectorOptionRepositoryPort {

    private final TeamSectorOptionJpaRepository jpaRepository;

    public TeamSectorOptionPersistenceAdapter(TeamSectorOptionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<String> findByTeamId(Long teamId) {
        return jpaRepository.findByTeamIdOrderBySectorValue(teamId).stream()
                .map(TeamSectorOptionJpaEntity::getSectorValue)
                .toList();
    }

    @Override
    @Transactional
    public void replaceAll(Long teamId, Set<String> sectorValues) {
        if (sectorValues.isEmpty()) {
            jpaRepository.deleteByTeamId(teamId);
            return;
        }
        // Once-sil-sonra-ekle YERINE "eskiyi temizle, yeniyi cakismada yut" -
        // ayni takim icin ust uste tetiklenen iki sync'in birbirini "duplicate
        // key" ile patlatmamasi icin (bkz. JpaRepository yorumu, canli testte
        // tespit edildi).
        jpaRepository.deleteStale(teamId, sectorValues);
        for (String value : sectorValues) {
            jpaRepository.insertIfAbsent(teamId, value);
        }
    }
}
