package com.aksa.capacityplanner.integration.persistence;

import com.aksa.capacityplanner.team.adapter.out.persistence.TeamPersistenceAdapter;
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamType;
import org.junit.jupiter.api.Test;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Persistence adapter <-> JPA entity mapping dogrulugu. H2 (in-memory) kullanir,
 * Postgres'e ozgu ozellikler (jsonb, kismi unique index) burada test edilmez -
 * onlar module katmaninda (Testcontainers Postgres) dogrulanir.
 */
@DataJpaTest
@ActiveProfiles("test-h2")
@Import(TeamPersistenceAdapter.class)
class TeamPersistenceAdapterIT {

    @org.springframework.beans.factory.annotation.Autowired
    private TeamPersistenceAdapter adapter;

    @Test
    void save_thenFindById_roundTripsAllFields() {
        Team team = new Team(null, "RPA Ekibi", "Robotik Surec Otomasyonu",
                new BigDecimal("0.2500"), new BigDecimal("120.00"), TeamType.RPA, "RPA", 538L, true);

        Team saved = adapter.save(team);
        Optional<Team> found = adapter.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("RPA Ekibi");
        assertThat(found.get().getMaintenanceAllocationPercent()).isEqualByComparingTo("0.2500");
        assertThat(found.get().getDefaultTargetWorkDays()).isEqualByComparingTo("120.00");
        assertThat(found.get().getTeamType()).isEqualTo(TeamType.RPA);
        assertThat(found.get().getJiraProjectKey()).isEqualTo("RPA");
        assertThat(found.get().getJiraBoardId()).isEqualTo(538L);
        assertThat(found.get().isRosterLocked()).isTrue();
    }

    @Test
    void findAll_returnsAllSavedTeams() {
        adapter.save(new Team(null, "Ekip A", null, BigDecimal.ZERO, null, TeamType.GENEL, null, null, false));
        adapter.save(new Team(null, "Ekip B", null, BigDecimal.ZERO, null, TeamType.GENEL, null, null, false));

        List<Team> all = adapter.findAll();

        assertThat(all).extracting(Team::getName).contains("Ekip A", "Ekip B");
    }

    @Test
    void deleteById_removesTeam() {
        Team saved = adapter.save(new Team(null, "Silinecek Ekip", null, BigDecimal.ZERO, null, TeamType.GENEL, null, null, false));

        adapter.deleteById(saved.getId());

        assertThat(adapter.findById(saved.getId())).isEmpty();
    }
}
