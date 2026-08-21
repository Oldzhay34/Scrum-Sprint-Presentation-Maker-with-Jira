package com.aksa.capacityplanner.unit.jiraintegration;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.adapter.JiraSyncProcessor;
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
import com.aksa.capacityplanner.team.domain.Team;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamSectorOptionRepositoryPort;
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
class JiraSyncProcessorTest {

    private static final Long TEAM_ID = 1L;

    private FakeJiraGatewayPort jiraGatewayPort;
    private FakeWorkItemRepository workItemRepository;
    private FakeTeamMemberRepository teamMemberRepository;
    private FakeTeamRepository teamRepository;
    private FakeAuditLogRepository auditLogRepository;
    private FakeTeamSectorOptionRepository teamSectorOptionRepository;
    private JiraSyncProcessor consumer;

    @BeforeEach
    void setUp() {
        jiraGatewayPort = new FakeJiraGatewayPort();
        workItemRepository = new FakeWorkItemRepository();
        auditLogRepository = new FakeAuditLogRepository();
        teamSectorOptionRepository = new FakeTeamSectorOptionRepository();
        List<TeamMember> members = List.of(
                new TeamMember(10L, TEAM_ID, "Pelinsu Çevikel", "PO", "pelinsu.cevikel@aksa.com.tr",
                        null, null, null, false),
                new TeamMember(11L, TEAM_ID, "Osman Bal", "Developer", null, null, null, null, false));
        teamMemberRepository = new FakeTeamMemberRepository(members);
        teamRepository = new FakeTeamRepository();
        consumer = new JiraSyncProcessor(jiraGatewayPort, workItemRepository, teamMemberRepository,
                teamRepository, auditLogRepository, new ConcurrentMapCacheManager("capacity-dashboard"),
                new FakeHolidayCalendarPort(), teamSectorOptionRepository);
    }

    @Test
    void flaggedSectorAndPriority_extractedFromJiraFields() {
        Map<String, Object> f = fields(Map.of(
                "customfield_10021", List.of(Map.of("value", "Impediment", "id", "10019")),
                "customfield_10498", Map.of("value", "EPSAS", "id", "1"),
                "priority", Map.of("name", "Yüksek", "id", "2")));
        jiraGatewayPort.issues = List.of(issue("RPA-50", "Bayrakli is", "Açık", f));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-50");
        assertThat(item.isFlagged()).isTrue();
        assertThat(item.getSector()).isEqualTo("EPSAS");
        assertThat(item.getPriority()).isEqualTo("Yüksek");
    }

    @Test
    void unflagged_emptySectorAndPriority_whenFieldsAbsent() {
        jiraGatewayPort.issues = List.of(issue("RPA-51", "Bayraksiz is", "Açık", fields(Map.of())));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-51");
        assertThat(item.isFlagged()).isFalse();
        assertThat(item.getSector()).isNull();
        assertThat(item.getPriority()).isNull();
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
    void assignee_withNoRosterMatch_autoProvisionsNewTeamMember_whenAtOrAboveMinItemThreshold() {
        // Takim rosterinde karsiligi olmayan gercek bir Jira katilimcisi, bu sync
        // batch'inde MIN_ITEMS_FOR_AUTO_PROVISION (10) veya uzerinde is kalemine
        // sahipse YENI bir TeamMember otomatik olusturulur - "gercek katilimci"
        // sayilmasi icin tek/birkac is kalemi yeterli degil (bkz. asagidaki
        // belowMinItemThreshold testi).
        List<JiraIssueSnapshot> tenIssues = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Map<String, Object> fields = fields(Map.of());
            fields.put("assignee", Map.of("accountId", "acc-yeni", "displayName", "Bilinmeyen Kisi"));
            tenIssues.add(issue("RPA-7-" + i, "Roster'da olmayan atanan", "Açık", fields));
        }
        jiraGatewayPort.issues = tenIssues;

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-7-1");
        assertThat(item.getTeamMemberId()).isNotNull();
        TeamMember created = teamMemberRepository.findById(item.getTeamMemberId()).orElseThrow();
        assertThat(created.getFullName()).isEqualTo("Bilinmeyen Kisi");
        assertThat(created.getJiraAccountId()).isEqualTo("acc-yeni");
        // startDate hep null oldugu icin TargetWorkDaysCalculator hep 145 doner (bkz.
        // kullanici bildirimi, 2026-08-18: "kullanılabilir kapasite ... boş geliyor").
        assertThat(created.getTargetWorkDays()).isEqualByComparingTo("145");
        assertThat(auditLogRepository.lastEntry.getActionLabel()).contains("1 yeni takim uyesi otomatik eklendi");
    }

    @Test
    void assignee_belowMinItemThreshold_notAutoProvisioned() {
        // Roster'da karsiligi olmayan bir kisinin bu sync batch'inde SADECE 3 is
        // kalemi varsa (esik: 10) YENI TeamMember olusturulmaz - is kalemleri
        // "atanmamis" (team_member_id=null) kalir, takim toplamina girer ama kisi
        // bazli satirlarda gorunmez. Bkz. kullanici bildirimi, 2026-08-17: RPA
        // rosterinde gercek 8 kisi disinda, sadece 1-6 is kalemine sahip 7
        // "hayalet" uye birikmisti.
        List<JiraIssueSnapshot> threeIssues = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            Map<String, Object> fields = fields(Map.of());
            fields.put("assignee", Map.of("accountId", "acc-tek-seferlik", "displayName", "Tek Seferlik Kisi"));
            threeIssues.add(issue("RPA-30-" + i, "Bir kereligine atanan", "Açık", fields));
        }
        jiraGatewayPort.issues = threeIssues;

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-30-1").getTeamMemberId()).isNull();
        assertThat(teamMemberRepository.members.stream()
                .filter(m -> "acc-tek-seferlik".equals(m.getJiraAccountId())).count()).isZero();
        assertThat(auditLogRepository.lastEntry.getActionLabel()).doesNotContain("yeni takim uyesi otomatik eklendi");
    }

    @Test
    void assignee_notProvisioned_whenTeamRosterIsLocked_evenAboveMinItemThreshold() {
        // roster_locked=true takimlarda (bkz. V21 migration) esik ne olursa olsun
        // YENI TeamMember hic olusturulmaz - "en az N is kalemi" esigi RPA'da bazi
        // gercek-olmayan katilimcilar icin (Edip Yemen: 50, Aysegul Ay: 80 is
        // kalemi) yetersiz kalmisti (bkz. kullanici bildirimi, 2026-08-17).
        teamRepository.rosterLocked = true;
        List<JiraIssueSnapshot> tenIssues = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Map<String, Object> f = fields(Map.of());
            f.put("assignee", Map.of("accountId", "acc-cok-isli-ama-gercek-degil", "displayName", "Cok Isli Ama Gercek Degil"));
            tenIssues.add(issue("RPA-40-" + i, "Is #" + i, "Açık", f));
        }
        jiraGatewayPort.issues = tenIssues;

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-40-1").getTeamMemberId()).isNull();
        assertThat(teamMemberRepository.members.stream()
                .filter(m -> "acc-cok-isli-ama-gercek-degil".equals(m.getJiraAccountId())).count()).isZero();
        assertThat(auditLogRepository.lastEntry.getActionLabel()).doesNotContain("yeni takim uyesi otomatik eklendi");
    }

    @Test
    void assignee_sameNewPersonAcrossMultipleIssues_createsOnlyOneTeamMember() {
        List<JiraIssueSnapshot> tenIssues = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            Map<String, Object> f = fields(Map.of());
            f.put("assignee", Map.of("accountId", "acc-yeni", "displayName", "Yeni Kisi"));
            tenIssues.add(issue("RPA-20-" + i, "Is #" + i, "Açık", f));
        }
        jiraGatewayPort.issues = tenIssues;

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        Long id1 = workItemRepository.byKey("RPA-20-1").getTeamMemberId();
        Long id2 = workItemRepository.byKey("RPA-20-2").getTeamMemberId();
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
    void sprintField_withActiveEntry_setsSprintNameAndActiveSprintTrue() {
        Map<String, Object> f = fields(Map.of("customfield_10020", List.of(
                Map.of("id", 41, "name", "RPA Sprint 40", "state", "closed"),
                Map.of("id", 42, "name", "RPA Sprint 41", "state", "active"))));
        jiraGatewayPort.issues = List.of(issue("RPA-60", "Aktif sprintte", "Açık", f));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-60");
        assertThat(item.isActiveSprint()).isTrue();
        assertThat(item.getSprintName()).isEqualTo("RPA Sprint 41");
    }

    @Test
    void sprintField_withNoActiveEntry_leavesActiveSprintFalse() {
        Map<String, Object> f = fields(Map.of("customfield_10020", List.of(
                Map.of("id", 41, "name", "RPA Sprint 40", "state", "closed"))));
        jiraGatewayPort.issues = List.of(issue("RPA-61", "Kapali sprintte", "Açık", f));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-61");
        assertThat(item.isActiveSprint()).isFalse();
        assertThat(item.getSprintName()).isNull();
    }

    @Test
    void sprintField_absent_leavesActiveSprintFalse() {
        jiraGatewayPort.issues = List.of(issue("RPA-62", "Backlog", "Açık", fields(Map.of())));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        WorkItem item = workItemRepository.byKey("RPA-62");
        assertThat(item.isActiveSprint()).isFalse();
        assertThat(item.getSprintName()).isNull();
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

    @Test
    void parentField_setsParentKeyTitleAndIssueType() {
        Map<String, Object> f = fields(Map.of(
                "issuetype", Map.of("name", "Görev"),
                "parent", Map.of("key", "SD-1670", "fields", Map.of("summary", "İK Teşvik Takibi"))));
        jiraGatewayPort.issues = List.of(issue("SD-1653", "Test ortam hazırlıkları", "Açık", f));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "SD", null));

        WorkItem item = workItemRepository.byKey("SD-1653");
        assertThat(item.getParentKey()).isEqualTo("SD-1670");
        assertThat(item.getParentTitle()).isEqualTo("İK Teşvik Takibi");
        assertThat(item.getIssueType()).isEqualTo("Görev");
    }

    @Test
    void previousSprint_isTheMostRecentlyClosedSprintAcrossAllIssues() {
        Map<String, Object> oldClosed = fields(Map.of("customfield_10020", List.of(
                Map.of("id", 40, "name", "Sprint 11", "state", "closed", "endDate", "2026-06-30T07:00:00.000Z"))));
        Map<String, Object> newestClosed = fields(Map.of("customfield_10020", List.of(
                Map.of("id", 41, "name", "Sprint 12", "state", "closed", "endDate", "2026-08-06T07:00:00.000Z"))));
        Map<String, Object> activeOnly = fields(Map.of("customfield_10020", List.of(
                Map.of("id", 42, "name", "Sprint 13", "state", "active", "endDate", "2026-09-03T07:00:00.000Z"))));
        jiraGatewayPort.issues = List.of(
                issue("RPA-70", "Eski sprint", "Açık", oldClosed),
                issue("RPA-71", "Onceki sprint", "Açık", newestClosed),
                issue("RPA-72", "Aktif sprint", "Açık", activeOnly));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-70").isPreviousSprint()).isFalse();
        assertThat(workItemRepository.byKey("RPA-71").isPreviousSprint()).isTrue();
        assertThat(workItemRepository.byKey("RPA-72").isPreviousSprint()).isFalse();
        assertThat(workItemRepository.byKey("RPA-72").isActiveSprint()).isTrue();
    }

    @Test
    void createdField_fillsAddedDate_evenWithNonIsoOffset() {
        jiraGatewayPort.issues = List.of(
                issue("RPA-80", "Olusturma tarihli", "Açık",
                        fields(Map.of("created", "2026-05-14T09:12:33.000+0300"))),
                issue("RPA-81", "Olusturma tarihsiz", "Açık", fields(Map.of())));

        consumer.onSyncRequested(new JiraSyncRequestedMessage(TEAM_ID, "RPA", null));

        assertThat(workItemRepository.byKey("RPA-80").getAddedDate())
                .isEqualTo(java.time.LocalDate.of(2026, 5, 14));
        // "created" gelmezse eski davranis (senkronizasyon gunu) korunur.
        assertThat(workItemRepository.byKey("RPA-81").getAddedDate()).isNotNull();
    }

    private static Map<String, Object> fields(Map<String, Object> base) {
        return new LinkedHashMap<>(base);
    }

    private static JiraIssueSnapshot issue(String key, String summary, String statusName, Map<String, Object> fields) {
        return new JiraIssueSnapshot(key, summary, statusName, fields);
    }

    /** HolidayCalendarPort'un test-icin bos takvim donen sahte implementasyonu. */
    private static class FakeHolidayCalendarPort implements HolidayCalendarPort {
        @Override
        public java.util.Set<java.time.LocalDate> getFullDayHolidays(int year) {
            return java.util.Set.of();
        }

        @Override
        public java.util.Set<java.time.LocalDate> getHalfDayHolidays(int year) {
            return java.util.Set.of();
        }
    }

    /** JiraGatewayPort'un test-icin sabit sonuc donen sahte implementasyonu. */
    private static class FakeJiraGatewayPort implements JiraGatewayPort {
        List<JiraIssueSnapshot> issues = List.of();
        Map<String, String> sectorByIssueKey = Map.of();

        @Override
        public List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query) {
            return issues;
        }

        @Override
        public Map<String, String> fetchSectorByIssueKeys(List<String> issueKeys) {
            Map<String, String> result = new HashMap<>();
            for (String key : issueKeys) {
                if (sectorByIssueKey.containsKey(key)) {
                    result.put(key, sectorByIssueKey.get(key));
                }
            }
            return result;
        }

        Map<String, String> labelsByIssueKey = Map.of();

        @Override
        public Map<String, String> fetchLabelsByIssueKeys(List<String> issueKeys) {
            Map<String, String> result = new HashMap<>();
            for (String key : issueKeys) {
                if (labelsByIssueKey.containsKey(key)) {
                    result.put(key, labelsByIssueKey.get(key));
                }
            }
            return result;
        }
    }

    /** TeamSectorOptionRepositoryPort'un test-icin sahte implementasyonu. */
    private static class FakeTeamSectorOptionRepository implements TeamSectorOptionRepositoryPort {
        final Map<Long, java.util.Set<String>> byTeam = new HashMap<>();

        @Override
        public List<String> findByTeamId(Long teamId) {
            return byTeam.getOrDefault(teamId, java.util.Set.of()).stream().sorted().toList();
        }

        @Override
        public void replaceAll(Long teamId, java.util.Set<String> sectorValues) {
            byTeam.put(teamId, new java.util.HashSet<>(sectorValues));
        }
    }

    /** TeamRepositoryPort'un test-icin sahte implementasyonu - sadece rosterLocked flag'i test edilir. */
    private static class FakeTeamRepository implements TeamRepositoryPort {
        boolean rosterLocked = false;

        @Override
        public Team save(Team team) {
            return team;
        }

        @Override
        public java.util.Optional<Team> findById(Long id) {
            return java.util.Optional.of(new Team(id, "RPA Ekibi", null, null, null, null, "RPA", null, rosterLocked));
        }

        @Override
        public List<Team> findAll() {
            return List.of();
        }

        @Override
        public void deleteById(Long id) {
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
