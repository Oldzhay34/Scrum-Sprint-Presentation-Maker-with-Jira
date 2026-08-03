package com.aksa.capacityplanner.integration.persistence;

import com.aksa.capacityplanner.team.adapter.out.persistence.TeamMemberPersistenceAdapter;
import com.aksa.capacityplanner.team.domain.TeamMember;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test-h2")
@Import(TeamMemberPersistenceAdapter.class)
class TeamMemberPersistenceAdapterIT {

    @Autowired
    private TeamMemberPersistenceAdapter adapter;

    @Test
    void save_thenFindById_roundTripsCustomFieldValuesJson() {
        TeamMember member = new TeamMember(null, 1L, "Alp Uguducu", "Gelistirici", "alp@aksa.com",
                LocalDate.of(2025, 3, 1), "OPEN", new BigDecimal("145.00"), false);
        member.setCustomFieldValues(Map.of("fteOrani", "0.8", "lokasyon", "Kavacik"));

        TeamMember saved = adapter.save(member);
        Optional<TeamMember> found = adapter.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getCustomFieldValues())
                .containsEntry("fteOrani", "0.8")
                .containsEntry("lokasyon", "Kavacik");
    }

    @Test
    void findByTeamId_returnsOnlyMembersOfThatTeam() {
        adapter.save(baseMember(1L, "Kisi A"));
        adapter.save(baseMember(1L, "Kisi B"));
        adapter.save(baseMember(2L, "Baska Ekipten Kisi"));

        var teamOneMembers = adapter.findByTeamId(1L);

        assertThat(teamOneMembers).extracting(TeamMember::getFullName)
                .containsExactlyInAnyOrder("Kisi A", "Kisi B");
    }

    private TeamMember baseMember(Long teamId, String name) {
        return new TeamMember(null, teamId, name, "Gelistirici", null,
                LocalDate.of(2025, 1, 1), "OPEN", new BigDecimal("145"), false);
    }
}
