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
        consumer = new JiraSyncRequestConsumer(jiraGatewayPort, workItemRepository, new FakeTeamMemberRepository(members),
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
    void assignee_unmatched_leavesTeamMemberIdNull_andIsReportedInAuditLabel() {
        Map<String, Object> fields = fields(Map.of());
        fields.put("assignee", Map.of("displayName", "Bilinmeyen Kisi"));
        jiraGatewayPort.issues = List.of(issue("RPA-7", "Eslesmeyen atanan", "Açık", fields));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-7").getTeamMemberId()).isNull();
        assertThat(auditLogRepository.lastEntry.getActionLabel()).contains("1 atanan kisi eslestirilemedi");
    }

    @Test
    void resync_ofSameIssueKey_updatesExistingWorkItem_insteadOfDuplicating() {
        jiraGatewayPort.issues = List.of(issue("RPA-8", "Ilk hal", "Açık", fields(Map.of("customfield_10503", 480))));
        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));
        Long firstId = workItemRepository.byKey("RPA-8").getId();

        jiraGatewayPort.issues = List.of(issue("RPA-8", "Guncellendi", "Canlı", fields(Map.of("customfield_10503", 960))));
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
        private final List<TeamMember> members;

        FakeTeamMemberRepository(List<TeamMember> members) {
            this.members = members;
        }

        @Override
        public TeamMember save(TeamMember member) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Optional<TeamMember> findById(Long id) {
            return members.stream().filter(m -> m.getId().equals(id)).findFirst();
        }

        @Override
        public List<TeamMember> findByTeamId(Long teamId) {
            return members;
        }

        @Override
        public void deleteById(Long id) {
            throw new UnsupportedOperationException();
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
