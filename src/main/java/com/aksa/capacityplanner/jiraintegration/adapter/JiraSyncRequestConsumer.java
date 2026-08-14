package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.config.JiraSyncQueueConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraIssueSnapshot;
import com.aksa.capacityplanner.jiraintegration.domain.JiraEstimationFieldMapper;
import com.aksa.capacityplanner.jiraintegration.domain.JiraStatusMapper;
import com.aksa.capacityplanner.jiraintegration.domain.TeamMemberMatcher;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * jira.sync.request.queue tuketicisi. JiraGatewayPort uzerinden issue'lari ceker
 * ve WorkItem olarak upsert eder. Jira baglantisi devrede degilken (NoOpJiraGatewayAdapter)
 * bos liste doner, bu durumda hicbir sey yapmadan biter - akis yine de uctan uca calisir.
 *
 * Gercek Jira alan eslemesi (fieldValues -> WorkItem) status/efor/assignee icin
 * TUM takimlarda gecerli genel kurallara dayanir (bkz. JiraStatusMapper,
 * JiraEstimationFieldMapper, TeamMemberMatcher); takima ozgu ek alan mapping'i
 * (sektor, departman vb.) ileride bu sinifa veya ayri bir JiraFieldMapper'a eklenebilir.
 *
 * "POST /api/teams/{teamId}/jira-sync" tetikleme istegi zaten AuditLogInterceptor
 * uzerinden otomatik loglaniyor (bkz. AuditActionResolver: JIRA_SYNC) - ama bu SADECE
 * "istek kuyruga alindi" anlamina gelir. Asil veri cekme/upsert islemi burada, HTTP
 * istek dongusunun DISINDA (RabbitMQ consumer thread'inde) gerceklestigi icin
 * interceptor bunu goremez; sonucu (kac is kalemi cekildi/basarisiz oldu) audit_log'a
 * bu sinif dogrudan yazar.
 */
@Component
public class JiraSyncRequestConsumer {

    private static final Logger log = LoggerFactory.getLogger(JiraSyncRequestConsumer.class);

    private final JiraGatewayPort jiraGatewayPort;
    private final WorkItemRepositoryPort workItemRepository;
    private final TeamMemberRepositoryPort teamMemberRepository;
    private final AuditLogRepositoryPort auditLogRepository;
    private final CacheManager cacheManager;

    public JiraSyncRequestConsumer(JiraGatewayPort jiraGatewayPort, WorkItemRepositoryPort workItemRepository,
                                    TeamMemberRepositoryPort teamMemberRepository,
                                    AuditLogRepositoryPort auditLogRepository, CacheManager cacheManager) {
        this.jiraGatewayPort = jiraGatewayPort;
        this.workItemRepository = workItemRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.auditLogRepository = auditLogRepository;
        this.cacheManager = cacheManager;
    }

    @RabbitListener(queues = JiraSyncQueueConfig.REQUEST_QUEUE)
    public void onSyncRequested(JiraSyncRequestedMessage message) {
        log.info("Jira sync istegi alindi: teamId={}, project={}", message.teamId(), message.jiraProjectKey());

        List<JiraIssueSnapshot> issues;
        try {
            issues = jiraGatewayPort.fetchIssues(
                    new JiraGatewayPort.JiraFetchQuery(message.jiraProjectKey(), message.jql()));
        } catch (RuntimeException e) {
            log.error("Jira'dan issue cekilemedi. teamId={}, project={}", message.teamId(), message.jiraProjectKey(), e);
            recordAudit(message.teamId(), false, "Jira'dan veri cekilemedi: " + e.getMessage());
            throw e; // mevcut DLQ/requeue davranisi korunur - sadece basarisizlik ayrica loglanir
        }

        if (issues.isEmpty()) {
            log.info("Jira'dan donen issue yok (jira.enabled=false veya sonuc bos). teamId={}", message.teamId());
            recordAudit(message.teamId(), true, "Jira senkronizasyonu tamamlandi - senkronize edilecek is kalemi bulunamadi");
            return;
        }

        // Mutable liste: bu sync batch'i icinde YENI otomatik olusturulan bir uye,
        // ayni batch'teki sonraki issue'lar icin de hemen eslesebilsin (ayni kisiye
        // ait birden fazla issue varsa, ayni kisi icin IKI KERE TeamMember olusmasin).
        List<TeamMember> teamMembers = new java.util.ArrayList<>(teamMemberRepository.findByTeamId(message.teamId()));

        int upserted = 0;
        int failed = 0;
        int newlyProvisioned = 0;
        for (JiraIssueSnapshot issue : issues) {
            try {
                boolean wasNewMember = upsert(message.teamId(), message.jiraProjectKey(), issue, teamMembers);
                upserted++;
                if (wasNewMember) {
                    newlyProvisioned++;
                }
            } catch (RuntimeException e) {
                // Tek bir issue'nun (orn. status_options'ta karsiligi olmayan bir Jira
                // statusu - bkz. V8 chk_work_items_status_code) basarisiz olmasi tum
                // senkronizasyon partisini durdurmasin; digerleri islenmeye devam eder.
                failed++;
                log.warn("Issue upsert edilemedi, atlaniyor. issueKey={}, teamId={}", issue.issueKey(), message.teamId(), e);
            }
        }
        if (newlyProvisioned > 0) {
            log.info("Jira'dan otomatik olusturulan yeni takim uyesi sayisi: {} (teamId={}) - takim rosterinde "
                    + "eksik olan gercek Jira katilimcilari icin.", newlyProvisioned, message.teamId());
        }

        String label = "Jira senkronizasyonu tamamlandi: " + upserted + " is kalemi guncellendi"
                + (failed > 0 ? ", " + failed + " basarisiz" : "")
                + (newlyProvisioned > 0 ? ", " + newlyProvisioned + " yeni takim uyesi otomatik eklendi" : "");
        recordAudit(message.teamId(), failed == 0, label);

        if (upserted > 0) {
            evictCapacityDashboardCache();
        }
    }

    /**
     * CapacityDashboardService.getDashboard() @Cacheable("capacity-dashboard")
     * ile TTL boyunca (app.cache.ttl-seconds, varsayilan 300sn) sonucu
     * onbelleklıyor - work_items burada guncellendikten SONRA bu cache
     * silinmezse, kullanici "Yenile"ye bassa bile TTL dolana kadar ESKI
     * (senkron ONCESI) sayilari gormeye devam ederdi. Cache key tum
     * DashboardQuery'yi (teamId+tarihler) icerdigi icin tek bir takima ozel
     * silme yapilamiyor - butun "capacity-dashboard" cache'i temizlenir (hafif
     * bir hesaplama oldugu icin bunun maliyeti onemsiz).
     */
    private void evictCapacityDashboardCache() {
        Cache cache = cacheManager.getCache("capacity-dashboard");
        if (cache != null) {
            cache.clear();
        }
    }

    /** Jira'nin saniye cinsinden tuttugu sure alanlarini gun'e cevirirken kullanilan is gunu uzunlugu (Jira Cloud varsayilani). */
    private static final BigDecimal SECONDS_PER_WORK_DAY = BigDecimal.valueOf(8L * 60 * 60);
    /** customfield_10503 (Efor A/DK) dakika cinsinden - gune cevirirken bolunecek is gunu uzunlugu (8 saat = 480 dk). */
    private static final BigDecimal MINUTES_PER_WORK_DAY = BigDecimal.valueOf(480L);

    /** @return bu issue icin YENI bir TeamMember otomatik olusturulduysa true (audit ozetinde sayilir). */
    private boolean upsert(Long teamId, String jiraProjectKey, JiraIssueSnapshot issue, List<TeamMember> teamMembers) {
        // Jira'nin kendi statu adlari (orn. "PROD", "Açık") uygulamanin
        // status_options.code degerleriyle (orn. "Canlı", "Backlog") birebir
        // AYNI degil - dogrudan issue.statusName() yazmak V8'deki
        // chk_work_items_status_code kontrolunu her satirda ihlal ediyordu.
        String appStatusCode = JiraStatusMapper.resolve(issue.statusName());
        BigDecimal plannedEffortDays = extractPlannedEffortDays(issue.fieldValues());
        // RPA ISTISNASI: bir hikayenin kendi customfield_10503'u, alt gorevlerinin
        // TOPLAMIDIR (kisiye ozel degil) - alt gorevi OLAN bir parent'ta bu degeri
        // aynen kullanmak, o eforu hem parent'ta hem de her alt gorevde AYRI AYRI
        // saymak (cift sayim) anlamina gelir. Gercek kisi bazli efor alt gorev
        // seviyesinde (kendi assignee'si, kendi customfield_10503'uyle) zaten
        // ayrica geliyor - bu yuzden alt gorevi olan RPA parent'larinin kendi
        // eforu burada BILEREK 0'a sabitlenir (bkz. kullanici bildirimi, 2026-08-14).
        if ("RPA".equals(jiraProjectKey) && hasSubtasks(issue.fieldValues())) {
            plannedEffortDays = BigDecimal.ZERO;
        }

        TeamMemberMatcher.JiraAssignee assignee = TeamMemberMatcher.extractAssignee(issue.fieldValues().get("assignee"));
        boolean createdNewMember = false;
        Long teamMemberId = null;
        if (assignee != null) {
            TeamMember matched = TeamMemberMatcher.resolve(assignee, teamMembers);
            if (matched != null) {
                teamMemberId = matched.getId();
                backfillJiraIdentity(matched, assignee);
            } else {
                TeamMember created = provisionTeamMember(teamId, assignee);
                teamMembers.add(created);
                teamMemberId = created.getId();
                createdNewMember = true;
            }
        }

        WorkItem workItem = workItemRepository.findByJiraIssueKey(issue.issueKey())
                .orElseGet(() -> new WorkItem(null, teamId, null, issue.summary(), issue.issueKey(),
                        BigDecimal.ZERO, appStatusCode, WorkItemSource.JIRA, LocalDate.now(), null));
        workItem.setTitle(issue.summary());
        workItem.setStatusCode(appStatusCode);
        workItem.setPlannedEffortDays(plannedEffortDays);
        workItem.setTeamMemberId(teamMemberId);
        workItemRepository.save(workItem);

        return createdNewMember;
    }

    /**
     * Isim/email ile eslesen ESKI (manuel girilmis) bir TeamMember'in jiraAccountId/avatarUrl
     * alanlari henuz bossa (veya Jira tarafinda degistiyse) burada geriye doldurulur - boylece
     * bir dahaki senkronizasyonda artik isim eslestirmesine degil dogrudan accountId'ye guvenilir.
     */
    private void backfillJiraIdentity(TeamMember member, TeamMemberMatcher.JiraAssignee assignee) {
        boolean changed = false;
        if (assignee.accountId() != null && !assignee.accountId().equals(member.getJiraAccountId())) {
            member.setJiraAccountId(assignee.accountId());
            changed = true;
        }
        if (assignee.avatarUrl() != null && !assignee.avatarUrl().equals(member.getAvatarUrl())) {
            member.setAvatarUrl(assignee.avatarUrl());
            changed = true;
        }
        if (changed) {
            teamMemberRepository.save(member);
        }
    }

    /**
     * Takim rosterinde (team_members) karsiligi olmayan gercek bir Jira katilimcisi icin
     * yeni bir TeamMember olusturur - referans "Jira Dashboard" projesindeki gibi, uyelik
     * manuel bir listeye degil dogrudan Jira'nin kendisine dayanir. role/startDate/statusCode
     * bilerek bos birakilir (Jira bu bilgileri saglamaz) - takim yoneticisi sonradan doldurabilir.
     */
    private TeamMember provisionTeamMember(Long teamId, TeamMemberMatcher.JiraAssignee assignee) {
        TeamMember member = new TeamMember(null, teamId, assignee.displayName(), null, assignee.email(),
                null, null, null, false);
        member.setJiraAccountId(assignee.accountId());
        member.setAvatarUrl(assignee.avatarUrl());
        TeamMember saved = teamMemberRepository.save(member);
        log.info("Yeni takim uyesi otomatik olusturuldu: '{}' (teamId={}, jiraAccountId={})",
                assignee.displayName(), teamId, assignee.accountId());
        return saved;
    }

    /** Jira'nin "subtasks" alani, o issue'nun alt gorevlerinin (varsa) kisa listesini tasir. */
    private boolean hasSubtasks(Map<String, Object> fields) {
        return fields.get("subtasks") instanceof List<?> subtasks && !subtasks.isEmpty();
    }

    /**
     * Oncelik sirasi:
     *   1) customfield_10503 (Efor A/DK, DAKIKA) / 480 - kullanicinin dogrulanmis
     *      formul dokumaninda ("dk(issue)÷480") ve full-audit.json'daki PASS
     *      sonuclu "capacity-sample-member" kontrolunde teyit edilen, TUM
     *      takimlar icin gecerli birincil kaynak.
     *   2) customfield_10016, yoksa customfield_10057 (Story Points) - 1 SP = 1
     *      gun VARSAYILIR (dogrulanmamis bir katsayi varsayimidir - bkz.
     *      JiraEstimationFieldMapper javadoc'u), sadece 10503 bossa kullanilir.
     *   3) Saniye-tabanli zaman takibi alanlari (aggregate varsa o, yoksa
     *      issue'nun kendi tahmini) - RPA/IZ board'lari bunu hic KULLANMIYOR
     *      (hep null), ama diger takimlarda dolu olabilir.
     *   4) Hicbiri yoksa 0 (NOT NULL olan planned_effort_days'i bos birakamayiz).
     */
    private BigDecimal extractPlannedEffortDays(Map<String, Object> fields) {
        if (fields.get(JiraEstimationFieldMapper.EFFORT_MINUTES_FIELD_ID) instanceof Number minutes) {
            return BigDecimal.valueOf(minutes.doubleValue())
                    .divide(MINUTES_PER_WORK_DAY, 2, RoundingMode.HALF_UP);
        }

        Number storyPoints = JiraEstimationFieldMapper.resolveStoryPoints(fields);
        if (storyPoints != null) {
            return BigDecimal.valueOf(storyPoints.doubleValue()).setScale(2, RoundingMode.HALF_UP);
        }

        Object seconds = fields.get("aggregatetimeoriginalestimate");
        if (seconds == null) {
            seconds = fields.get("timeoriginalestimate");
        }
        if (!(seconds instanceof Number number)) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(number.doubleValue())
                .divide(SECONDS_PER_WORK_DAY, 2, RoundingMode.HALF_UP);
    }

    private void recordAudit(Long teamId, boolean success, String label) {
        AuditLog entry = new AuditLog();
        entry.setActorSicil("SYSTEM");
        entry.setActorName("Jira Senkronizasyonu (arka plan)");
        entry.setHttpMethod("SYSTEM");
        entry.setActionCode("JIRA_SYNC_RESULT");
        entry.setActionLabel(label);
        entry.setEntityType("TEAM");
        entry.setTeamId(teamId);
        entry.setStatusCode(success ? 200 : 500);
        entry.setSuccess(success);
        try {
            auditLogRepository.save(entry);
        } catch (RuntimeException e) {
            // Audit kaydi asil senkronizasyon sonucunu asla etkilememeli.
            log.warn("Jira sync audit kaydi yazilamadi. teamId={}", teamId, e);
        }
    }
}
