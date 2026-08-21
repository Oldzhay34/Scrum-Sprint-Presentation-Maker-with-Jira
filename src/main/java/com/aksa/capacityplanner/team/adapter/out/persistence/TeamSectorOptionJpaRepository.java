package com.aksa.capacityplanner.team.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface TeamSectorOptionJpaRepository extends JpaRepository<TeamSectorOptionJpaEntity, Long> {

    List<TeamSectorOptionJpaEntity> findByTeamIdOrderBySectorValue(Long teamId);

    void deleteByTeamId(Long teamId);

    /** sectorValues bos OLAMAZ (SQL "NOT IN ()" gecersizdir) - cagiran taraf bos durumu ayrica ele alir. */
    @Modifying
    @Query(value = "delete from team_sector_options where team_id = :teamId and sector_value not in (:sectorValues)",
            nativeQuery = true)
    void deleteStale(@Param("teamId") Long teamId, @Param("sectorValues") Collection<String> sectorValues);

    /**
     * Ayni takim icin AYNI ANDA calisan iki senkronizasyon (orn. kullanicinin
     * "Jira'dan Çek"e ust uste basmasi) yarisa girip ikisi de "once hepsini
     * sil, sonra ekle" yapinca ikinci INSERT "duplicate key" ile cakisiyordu
     * (canli testte tespit edildi, bkz. kullanici bildirimi 2026-08-18) -
     * ON CONFLICT DO NOTHING bu yarisi zararsiz hale getirir.
     */
    @Modifying
    @Query(value = "insert into team_sector_options (team_id, sector_value) values (:teamId, :sectorValue) "
            + "on conflict (team_id, sector_value) do nothing", nativeQuery = true)
    void insertIfAbsent(@Param("teamId") Long teamId, @Param("sectorValue") String sectorValue);
}
