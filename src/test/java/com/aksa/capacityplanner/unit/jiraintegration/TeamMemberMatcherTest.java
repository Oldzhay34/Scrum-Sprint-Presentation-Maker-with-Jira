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

    private static TeamMemberMatcher.JiraAssignee assignee(Object assigneeField) {
        return TeamMemberMatcher.extractAssignee(assigneeField);
    }

    @Test
    void resolve_matchesByJiraAccountId_evenIfNamesDiffer() {
        // Kalici kimlik: accountId eslesirse, displayName tamamen farkli olsa
        // (kisi Jira'da adini degistirmis olsa) bile dogru kisi bulunur.
        pelinsu.setJiraAccountId("account-123");
        Map<String, Object> raw = Map.of("accountId", "account-123", "displayName", "Farkli Bir Isim");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), teamMembers);

        assertThat(result).isEqualTo(pelinsu);
        pelinsu.setJiraAccountId(null); // testler arasi durum sizmasin
    }

    @Test
    void resolve_matchesByEmail_caseInsensitive() {
        Map<String, Object> raw = Map.of(
                "displayName", "PELINSU CEVIKEL",
                "emailAddress", "PELINSU.CEVIKEL@aksa.com.tr");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), teamMembers);

        assertThat(result).isEqualTo(pelinsu);
    }

    @Test
    void resolve_matchesByDisplayName_whenNoEmailOnJiraSide() {
        // Jira Cloud gizlilik ayarlarina gore emailAddress bos gelebilir.
        Map<String, Object> raw = Map.of("displayName", "OSMAN BAL");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), teamMembers);

        assertThat(result).isEqualTo(osman);
    }

    @Test
    void resolve_matchesByDisplayName_ignoringTurkishDiacritics() {
        Map<String, Object> raw = Map.of("displayName", "pelinsu cevikel");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), teamMembers);

        assertThat(result).isEqualTo(pelinsu);
    }

    @Test
    void resolve_returnsNull_whenNoMatchFound() {
        Map<String, Object> raw = Map.of("displayName", "Bilinmeyen Kisi");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), teamMembers);

        assertThat(result).isNull();
    }

    @Test
    void resolve_returnsNull_whenAssigneeFieldMissing() {
        TeamMember result = TeamMemberMatcher.resolve(assignee(null), teamMembers);

        assertThat(result).isNull();
    }

    @Test
    void resolve_matchesByNameToken_whenFullNameIsOnlyFirstName() {
        // Gercek RPA verisinde gorulen durum: TeamMember.fullName sadece "Atakan",
        // Jira'nin tam adi ise "Salim Atakan Bozkurt".
        TeamMember atakan = new TeamMember(3L, 1L, "Atakan", "Developer", null, null, null, null, false);
        List<TeamMember> members = List.of(pelinsu, osman, atakan);
        Map<String, Object> raw = Map.of("displayName", "Salim Atakan Bozkurt");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), members);

        assertThat(result).isEqualTo(atakan);
    }

    @Test
    void resolve_tokenFallback_skipsAmbiguousMatches() {
        // Iki farkli uye ayni token'a esit dusuyorsa (orn. iki "Salim"), hangisi
        // oldugu belirsiz - yanlis kisiye atamaktansa hic atamamak tercih edilir.
        TeamMember salim1 = new TeamMember(3L, 1L, "Salim", "Developer", null, null, null, null, false);
        TeamMember salim2 = new TeamMember(4L, 1L, "Salim", "Developer", null, null, null, null, false);
        List<TeamMember> members = List.of(salim1, salim2);
        Map<String, Object> raw = Map.of("displayName", "Salim Atakan Bozkurt");

        TeamMember result = TeamMemberMatcher.resolve(assignee(raw), members);

        assertThat(result).isNull();
    }

    @Test
    void extractAssignee_readsAccountIdEmailAndAvatarUrl() {
        Map<String, Object> raw = Map.of(
                "accountId", "acc-1",
                "displayName", "Test Kisi",
                "emailAddress", "test@aksa.com.tr",
                "avatarUrls", Map.of("48x48", "https://example.com/48.png", "16x16", "https://example.com/16.png"));

        TeamMemberMatcher.JiraAssignee result = assignee(raw);

        assertThat(result.accountId()).isEqualTo("acc-1");
        assertThat(result.displayName()).isEqualTo("Test Kisi");
        assertThat(result.email()).isEqualTo("test@aksa.com.tr");
        assertThat(result.avatarUrl()).isEqualTo("https://example.com/48.png");
    }

    @Test
    void extractAssignee_returnsNull_whenFieldIsNotAMap() {
        assertThat(assignee("not-a-map")).isNull();
        assertThat(assignee(null)).isNull();
    }
}
