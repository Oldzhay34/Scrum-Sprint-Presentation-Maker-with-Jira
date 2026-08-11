package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.config.JiraSyncQueueConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraIssueSnapshot;
import com.aksa.capacityplanner.jiraintegration.domain.JiraEstimationFieldMapper;
import com.aksa.capacityplanner.jiraintegration.domain.JiraStatusMapper;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
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
 * Gercek Jira alan eslemesi (fieldValues -> WorkItem) takima gore degisebilecegi icin
 * burada sadece ozet/durum gibi genel alanlar kullanilir; takima ozgu mapping ileride
 * bu sinifa veya ayri bir JiraFieldMapper'a eklenebilir.
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
    private final AuditLogRepositoryPort auditLogRepository;
    private final CacheManager cacheManager;

    public JiraSyncRequestConsumer(JiraGatewayPort jiraGatewayPort, WorkItemRepositoryPort workItemRepository,
                                    AuditLogRepositoryPort auditLogRepository, CacheManager cacheManager) {
        this.jiraGatewayPort = jiraGatewayPort;
        this.workItemRepository = workItemRepository;
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

        int upserted = 0;
        int failed = 0;
        for (JiraIssueSnapshot issue : issues) {
            try {
                upsert(message.teamId(), message.jiraProjectKey(), issue);
                upserted++;
            } catch (RuntimeException e) {
                // Tek bir issue'nun (orn. status_options'ta karsiligi olmayan bir Jira
                // statusu - bkz. V8 chk_work_items_status_code) basarisiz olmasi tum
                // senkronizasyon partisini durdurmasin; digerleri islenmeye devam eder.
                failed++;
                log.warn("Issue upsert edilemedi, atlaniyor. issueKey={}, teamId={}", issue.issueKey(), message.teamId(), e);
            }
        }

        String label = "Jira senkronizasyonu tamamlandi: " + upserted + " is kalemi guncellendi"
                + (failed > 0 ? ", " + failed + " basarisiz" : "");
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

    private void upsert(Long teamId, String jiraProjectKey, JiraIssueSnapshot issue) {
        // Jira'nin kendi statu adlari (orn. "PROD", "Açık") uygulamanin
        // status_options.code degerleriyle (orn. "Canlı", "Backlog") birebir
        // AYNI degil - dogrudan issue.statusName() yazmak V8'deki
        // chk_work_items_status_code kontrolunu her satirda ihlal ediyordu.
        String appStatusCode = JiraStatusMapper.resolve(issue.statusName());
        BigDecimal plannedEffortDays = extractPlannedEffortDays(jiraProjectKey, issue.fieldValues());

        WorkItem workItem = workItemRepository.findByJiraIssueKey(issue.issueKey())
                .orElseGet(() -> new WorkItem(null, teamId, null, issue.summary(), issue.issueKey(),
                        BigDecimal.ZERO, appStatusCode, WorkItemSource.JIRA, LocalDate.now(), null));
        workItem.setTitle(issue.summary());
        workItem.setStatusCode(appStatusCode);
        workItem.setPlannedEffortDays(plannedEffortDays);
        workItemRepository.save(workItem);
    }

    /**
     * RPA/IZ board'lari zaman takibi KULLANMIYOR (timeoriginalestimate vb. hep
     * null geliyordu - bkz. kullanici bildirimi "efor hep 0"). Once board'un
     * gercek estimation alanina (Story Points, proje bazinda farkli
     * customfield_XXXXX - bkz. JiraEstimationFieldMapper) bakilir; hicbir sey
     * yoksa (bilinmeyen proje veya alan bos) saniye-tabanli zaman takibi
     * alanlarina (aggregate varsa o, yoksa issue'nun kendi tahmini) dusulur;
     * o da yoksa 0 (NOT NULL olan planned_effort_days'i bos birakamayiz).
     */
    private BigDecimal extractPlannedEffortDays(String jiraProjectKey, Map<String, Object> fields) {
        String estimationFieldId = JiraEstimationFieldMapper.resolveFieldId(jiraProjectKey);
        if (estimationFieldId != null && fields.get(estimationFieldId) instanceof Number storyPoints) {
            // Story Points 1:1 gun olarak varsayilir - bkz. JiraEstimationFieldMapper javadoc'u.
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
