package com.aksa.capacityplanner.integration.persistence;

import com.aksa.capacityplanner.team.adapter.out.persistence.StatusOptionPersistenceAdapter;
import com.aksa.capacityplanner.team.domain.StatusOption;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test-h2")
@Import(StatusOptionPersistenceAdapter.class)
class StatusOptionPersistenceAdapterIT {

    @Autowired
    private StatusOptionPersistenceAdapter adapter;

    @Test
    void findAvailableForTeam_returnsGlobalAndTeamSpecificStatuses_butNotOtherTeams() {
        adapter.save(new StatusOption(null, null, "DONE", "Tamamlandi", true, "#00FF00", 0));
        adapter.save(new StatusOption(null, 1L, "FTE_REVIEW", "FTE Incelemesi", false, "#FFAA00", 1));
        adapter.save(new StatusOption(null, 2L, "OTHER_TEAM_ONLY", "Sadece Diger Ekip", false, null, 0));

        var result = adapter.findAvailableForTeam(1L);

        assertThat(result).extracting(StatusOption::getCode)
                .containsExactlyInAnyOrder("DONE", "FTE_REVIEW");
    }
}
