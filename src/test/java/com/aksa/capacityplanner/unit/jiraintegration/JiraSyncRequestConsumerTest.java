package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncRequestConsumer;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraFetchQuery;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraIssueSnapshot;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import com.aksa.capacityplanner.monitoring.domain.ActionOption;
import com.aksa.capacityplanner.monitoring.domain.ActorOption;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.domain.AuditLogFilter;
import com.aksa.capacityplanner.monitoring.domain.AuditLogPage;
import com.aksa.capacityplanner.monitoring.domain.AuditSummary;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * customfield_10503 (dakika) oncelikli efor cikarimini, SP fallback zincirini
 * ve assignee -> TeamMember eslemesini uctan uca (fakelerle) dogrular.
 */
class JiraSyncRequestConsumerTest {

    private static final Long TEAM_ID = 1L;

    private FakeJiraGatewayPort jiraGatewayPort;
    private FakeWorkItemRepository workItemRepository;
    private FakeTeamMemberRepository teamMemberRepository;
    private FakeAuditLogRepository auditLogRepository;
    private JiraSyncRequestConsumer consumer;

    @BeforeEach
    void setUp() {
        jiraGatewayPort = new FakeJiraGatewayPort();
        workItemRepository = new FakeWorkItemRepository();
        auditLogRepository = new FakeAuditLogRepository();
        List<TeamMember> members = List.of(
                new TeamMember(10L, TEAM_ID, "Pelinsu Çevikel", "PO", "pelinsu.cevikel@aksa.com.tr",
                        null, null, null, false),
                new TeamMember(11L, TEAM_ID, "Osman Bal", "Developer", null, null, null, null, false));
        teamMemberRepository = new FakeTeamMemberRepository(members);
        consumer = new JiraSyncRequestConsumer(jiraGatewayPort, workItemRepository, teamMemberRepository,
                auditLogRepository, new ConcurrentMapCacheManager("capacity-dashboard"));
    }

    @Test
    void effortMinutes_takesPriorityOverStoryPoints() {
        jiraGatewayPort.issues = List.of(issue("RPA-1", "Dakika ile efor", "Açık",
                fields(Map.of("customfield_10503", 960, "customfield_10016", 100))));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-1").getPlannedEffortDays()).isEqualByComparingTo("2.00");
    }

    @Test
    void storyPoints_fallBackChain_whenMinutesFieldMissing() {
        jiraGatewayPort.issues = List.of(
                issue("RPA-2", "SP 10016 ile", "Açık", fields(Map.of("customfield_10016", 3))),
                issue("RPA-3", "SP 10057 ile", "Açık", fields(Map.of("customfield_10057", 5))));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-2").getPlannedEffortDays()).isEqualByComparingTo("3.00");
        assertThat(workItemRepository.byKey("RPA-3").getPlannedEffortDays()).isEqualByComparingTo("5.00");
    }

    @Test
    void secondsBasedTimeTracking_usedOnlyWhenNoOtherFieldPresent() {
        jiraGatewayPort.issues = List.of(issue("RPA-4", "Zaman takibi", "Açık",
                fields(Map.of("aggregatetimeoriginalestimate", 28800))));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-4").getPlannedEffortDays()).isEqualByComparingTo("1.00");
    }

    @Test
    void noEffortFieldPresent_defaultsToZero() {
        jiraGatewayPort.issues = List.of(issue("RPA-5", "Bos", "Açık", fields(Map.of())));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-5").getPlannedEffortDays()).isEqualByComparingTo("0");
    }

    @Test
    void parentWithSubtasks_effortZeroedToAvoidDoubleCounting() {
        // Parent'in kendi customfield_10503'u alt gorevlerin TOPLAMI (RPA) ya da
        // tamamen BOS (SD) olabiliyor - ikisinde de kisiye ozel degil, gercek
        // kisi bazli efor alt gorevlerden ayrica geldigi icin parent'in kendi
        // eforu burada 0 sayilmali. Kural TUM projeler icin gecerli.
        Map<String, Object> parentFields = fields(Map.of("customfield_10503", 960));
        parentFields.put("subtasks", List.of(Map.of("key", "RPA-100")));
        jiraGatewayPort.issues = List.of(issue("RPA-9", "Alt gorevi olan parent", "Açık", parentFields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-9").getPlannedEffortDays()).isEqualByComparingTo("0");
    }

    @Test
    void leafIssueWithoutSubtasks_stillUsesOwnEffort() {
        Map<String, Object> fields = fields(Map.of("customfield_10503", 960));
        fields.put("subtasks", List.of());
        jiraGatewayPort.issues = List.of(issue("RPA-10", "Alt gorevsiz", "Açık", fields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-10").getPlannedEffortDays()).isEqualByComparingTo("2.00");
    }

    @Test
    void subtaskZeroingRule_appliesToNonRpaProjectsToo() {
        // SD-1733 gibi gercek vakalar: parent'in kendi eforu BOS, gercek efor
        // alt gorevlerde - RPA'ya ozel olmadigi canli veriyle dogrulandi.
        Map<String, Object> parentFields = fields(Map.of("customfield_10503", 960));
        parentFields.put("subtasks", List.of(Map.of("key", "SD-100")));
        jiraGatewayPort.issues = List.of(issue("SD-9", "Baska takim, alt gorevi var", "Açık", parentFields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "SD", null));

        assertThat(workItemRepository.byKey("SD-9").getPlannedEffortDays()).isEqualByComparingTo("0");
    }

    @Test
    void assignee_matchedByEmail_setsTeamMemberId() {
        Map<String, Object> fields = fields(Map.of());
        fields.put("assignee", Map.of("displayName", "PELINSU CEVIKEL", "emailAddress", "PELINSU.CEVIKEL@aksa.com.tr"));
        jiraGatewayPort.issues = List.of(issue("RPA-6", "Atanan var", "Açık", fields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-6").getTeamMemberId()).isEqualTo(10L);
        assertThat(auditLogRepository.lastEntry.isSuccess()).isTrue();
        assertThat(auditLogRepository.lastEntry.getActionLabel()).doesNotContain("eslestirilemedi");
    }

    @Test
    void assignee_withNoRosterMatch_autoProvisionsNewTeamMember() {
        // Takim rosterinde karsiligi olmayan gercek bir Jira katilimcisi icin
        // artik null birakmak yerine YENI bir TeamMember otomatik olusturulur.
        Map<String, Object> fields = fields(Map.of());
        fields.put("assignee", Map.of("accountId", "acc-yeni", "displayName", "Bilinmeyen Kisi"));
        jiraGatewayPort.issues = List.of(issue("RPA-7", "Roster'da olmayan atanan", "Açık", fields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-7");
        assertThat(item.getTeamMemberId()).isNotNull();
        TeamMember created = teamMemberRepository.findById(item.getTeamMemberId()).orElseThrow();
        assertThat(created.getFullName()).isEqualTo("Bilinmeyen Kisi");
        assertThat(created.getJiraAccountId()).isEqualTo("acc-yeni");
        assertThat(auditLogRepository.lastEntry.getActionLabel()).contains("1 yeni takim uyesi otomatik eklendi");
    }

    @Test
    void assignee_sameNewPersonAcrossMultipleIssues_createsOnlyOneTeamMember() {
        Map<String, Object> f1 = fields(Map.of());
        f1.put("assignee", Map.of("accountId", "acc-yeni", "displayName", "Yeni Kisi"));
        Map<String, Object> f2 = fields(Map.of());
        f2.put("assignee", Map.of("accountId", "acc-yeni", "displayName", "Yeni Kisi"));
        jiraGatewayPort.issues = List.of(
                issue("RPA-20", "Birinci is", "Açık", f1),
                issue("RPA-21", "Ikinci is", "Açık", f2));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        Long id1 = workItemRepository.byKey("RPA-20").getTeamMemberId();
        Long id2 = workItemRepository.byKey("RPA-21").getTeamMemberId();
        assertThat(id1).isEqualTo(id2);
        assertThat(teamMemberRepository.members.stream().filter(m -> "acc-yeni".equals(m.getJiraAccountId())).count()).isEqualTo(1);
    }

    @Test
    void assignee_matchedByLegacyNameFallback_backfillsJiraAccountId() {
        Map<String, Object> fields = fields(Map.of());
        fields.put("assignee", Map.of("accountId", "acc-osman", "displayName", "OSMAN BAL",
                "avatarUrls", Map.of("48x48", "https://example.com/osman.png")));
        jiraGatewayPort.issues = List.of(issue("RPA-22", "Isim fallback", "Açık", fields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        TeamMember osman = teamMemberRepository.findById(11L).orElseThrow();
        assertThat(osman.getJiraAccountId()).isEqualTo("acc-osman");
        assertThat(osman.getAvatarUrl()).isEqualTo("https://example.com/osman.png");
    }

    @Test
    void resync_ofSameIssueKey_updatesExistingWorkItem_insteadOfDuplicating() {
        jiraGatewayPort.issues = List.of(issue("RPA-8", "Ilk hal", "Açık", fields(Map.of("customfield_10503", 480))));
        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));
        Long firstId = workItemRepository.byKey("RPA-8").getId();

        jiraGatewayPort.issues = List.of(issue("RPA-8", "Guncellendi", "Tamamlandı", fields(Map.of("customfield_10503", 960))));
        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem updated = workItemRepository.byKey("RPA-8");
        assertThat(updated.getId()).isEqualTo(firstId);
        assertThat(updated.getTitle()).isEqualTo("Guncellendi");
        assertThat(updated.getStatusCode()).isEqualTo("Canlı");
        assertThat(updated.getPlannedEffortDays()).isEqualByComparingTo("2.00");
        assertThat(workItemRepository.all).hasSize(1);
    }

    private static Map<String, Object> fields(Map<String, Object> base) {
        return new LinkedHashMap<>(base);
    }

    private static JiraIssueSnapshot issue(String key, String summary, String statusName, Map<String, Object> fields) {
        return new JiraIssueSnapshot(key, summary, statusName, fields);
    }

    /** JiraGatewayPort'un test-icin sabit sonuc donen sahte implementasyonu. */
    private static class FakeJiraGatewayPort implements JiraGatewayPort {
        List<JiraIssueSnapshot> issues = List.of();

        @Override
        public List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query) {
            return issues;
        }
    }

    private static class FakeTeamMemberRepository implements TeamMemberRepositoryPort {
        final List<TeamMember> members;
        private long nextId = 100;

        FakeTeamMemberRepository(List<TeamMember> initial) {
            this.members = new ArrayList<>(initial);
        }

        @Override
        public TeamMember save(TeamMember member) {
            if (member.getId() == null) {
                member.setId(nextId++);
                members.add(member);
            }
            return member;
        }

        @Override
        public Optional<TeamMember> findById(Long id) {
            return members.stream().filter(m -> m.getId().equals(id)).findFirst();
        }

        @Override
        public List<TeamMember> findByTeamId(Long teamId) {
            return members.stream().filter(m -> m.getTeamId().equals(teamId)).toList();
        }

        @Override
        public void deleteById(Long id) {
            members.removeIf(m -> m.getId().equals(id));
        }
    }

    private static class FakeWorkItemRepository implements WorkItemRepositoryPort {
        final List<WorkItem> all = new ArrayList<>();
        private long nextId = 1;

        @Override
        public WorkItem save(WorkItem workItem) {
            if (workItem.getId() == null) {
                workItem.setId(nextId++);
                all.add(workItem);
            }
            return workItem;
        }

        @Override
        public Optional<WorkItem> findById(Long id) {
            return all.stream().filter(w -> w.getId().equals(id)).findFirst();
        }

        @Override
        public List<WorkItem> findByTeamId(Long teamId) {
            return all.stream().filter(w -> w.getTeamId().equals(teamId)).toList();
        }

        @Override
        public Optional<WorkItem> findByJiraIssueKey(String jiraIssueKey) {
            return all.stream().filter(w -> jiraIssueKey.equals(w.getJiraIssueKey())).findFirst();
        }

        @Override
        public void deleteById(Long id) {
            all.removeIf(w -> w.getId().equals(id));
        }

        WorkItem byKey(String jiraIssueKey) {
            return findByJiraIssueKey(jiraIssueKey).orElseThrow();
        }
    }

    private static class FakeAuditLogRepository implements AuditLogRepositoryPort {
        AuditLog lastEntry;

        @Override
        public AuditLog save(AuditLog entry) {
            this.lastEntry = entry;
            return entry;
        }

        @Override
        public AuditLogPage search(AuditLogFilter filter, int page, int size) {
            throw new UnsupportedOperationException();
        }

        @Override
        public AuditSummary summary() {
            throw new UnsupportedOperationException();
        }

        @Override
        public List<ActorOption> listDistinctActors() {
            throw new UnsupportedOperationException();
        }

        @Override
        public List<ActionOption> listDistinctActions() {
            throw new UnsupportedOperationException();
        }
    }
}
