package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.jiraintegration.domain.TeamMemberMatcher;
import com.aksa.capacityplanner.team.domain.TeamMember;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class TeamMemberMatcherTest {

    private final TeamMember pelinsu = new TeamMember(1L, 1L, "Pelinsu Çevikel", "PO",
            "pelinsu.cevikel@aksa.com.tr", null, null, null, false);
    private final TeamMember osman = new TeamMember(2L, 1L, "Osman Bal", "Developer",
            null, null, null, null, false);
    private final List<TeamMember> teamMembers = List.of(pelinsu, osman);

    @Test
    void resolveTeamMemberId_matchesByEmail_caseInsensitive() {
        Map<String, Object> assignee = Map.of(
                "displayName", "PELINSU CEVIKEL",
                "emailAddress", "PELINSU.CEVIKEL@aksa.com.tr");

        Long result = TeamMemberMatcher.resolveTeamMemberId(assignee, teamMembers);

        assertThat(result).isEqualTo(1L);
    }

    @Test
    void resolveTeamMemberId_matchesByDisplayName_whenNoEmailOnJiraSide() {
        // Jira Cloud gizlilik ayarlarina gore emailAddress bos gelebilir.
        Map<String, Object> assignee = Map.of("displayName", "OSMAN BAL");

        Long result = TeamMemberMatcher.resolveTeamMemberId(assignee, teamMembers);

        assertThat(result).isEqualTo(2L);
    }

    @Test
    void resolveTeamMemberId_matchesByDisplayName_ignoringTurkishDiacritics() {
        Map<String, Object> assignee = Map.of("displayName", "pelinsu cevikel");

        Long result = TeamMemberMatcher.resolveTeamMemberId(assignee, teamMembers);

        assertThat(result).isEqualTo(1L);
    }

    @Test
    void resolveTeamMemberId_returnsNull_whenNoMatchFound() {
        Map<String, Object> assignee = Map.of("displayName", "Bilinmeyen Kisi");

        Long result = TeamMemberMatcher.resolveTeamMemberId(assignee, teamMembers);

        assertThat(result).isNull();
    }

    @Test
    void resolveTeamMemberId_returnsNull_whenAssigneeFieldMissing() {
        Long result = TeamMemberMatcher.resolveTeamMemberId(null, teamMembers);

        assertThat(result).isNull();
    }
}
