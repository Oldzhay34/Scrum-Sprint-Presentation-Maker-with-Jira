package com.aksa.capacityplanner.jiraintegration.adapter;

import com.aksa.capacityplanner.capacity.domain.WorkItem;
import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import com.aksa.capacityplanner.capacity.port.out.WorkItemRepositoryPort;
import com.aksa.capacityplanner.jiraintegration.config.JiraSyncAsyncConfig;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort;
import com.aksa.capacityplanner.jiraintegration.port.JiraGatewayPort.JiraIssueSnapshot;
import com.aksa.capacityplanner.jiraintegration.domain.JiraEstimationFieldMapper;
import com.aksa.capacityplanner.jiraintegration.domain.JiraStatusMapper;
import com.aksa.capacityplanner.jiraintegration.domain.TeamMemberMatcher;
import com.aksa.capacityplanner.jiraintegration.port.JiraSyncRequestedMessage;
import com.aksa.capacityplanner.monitoring.domain.AuditLog;
import com.aksa.capacityplanner.monitoring.port.out.AuditLogRepositoryPort;
import com.aksa.capacityplanner.team.domain.TargetWorkDaysCalculator;
import com.aksa.capacityplanner.team.domain.TeamMember;
import com.aksa.capacityplanner.team.port.out.HolidayCalendarPort;
import com.aksa.capacityplanner.team.port.out.TeamMemberRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamRepositoryPort;
import com.aksa.capacityplanner.team.port.out.TeamSectorOptionRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Jira senkronizasyonunun arka plan isleyicisi (eskiden jira.sync.request.queue
 * RabbitMQ tuketicisiydi - bkz. JiraSyncAsyncConfig; kuyruk kalkti, isleme
 * mantigi AYNEN korundu). JiraGatewayPort uzerinden issue'lari ceker ve WorkItem
 * olarak upsert eder. Jira baglantisi devrede degilken (NoOpJiraGatewayAdapter)
 * bos liste doner, bu durumda hicbir sey yapmadan biter - akis yine de uctan uca calisir.
 *
 * Gercek Jira alan eslemesi (fieldValues -> WorkItem) status/efor/assignee icin
 * TUM takimlarda gecerli genel kurallara dayanir (bkz. JiraStatusMapper,
 * JiraEstimationFieldMapper, TeamMemberMatcher); takima ozgu ek alan mapping'i
 * (sektor, departman vb.) ileride bu sinifa veya ayri bir JiraFieldMapper'a eklenebilir.
 *
 * "POST /api/teams/{teamId}/jira-sync" tetikleme istegi zaten AuditLogInterceptor
 * uzerinden otomatik loglaniyor (bkz. AuditActionResolver: JIRA_SYNC) - ama bu SADECE
 * "istek arka plana alindi" anlamina gelir. Asil veri cekme/upsert islemi burada, HTTP
 * istek dongusunun DISINDA (jira-sync executor thread.inde) gerceklestigi icin
 * interceptor bunu goremez; sonucu (kac is kalemi cekildi/basarisiz oldu) audit_log'a
 * bu sinif dogrudan yazar.
 */
@Component
public class JiraSyncProcessor {

    private static final Logger log = LoggerFactory.getLogger(JiraSyncProcessor.class);

    private final JiraGatewayPort jiraGatewayPort;
    private final WorkItemRepositoryPort workItemRepository;
    private final TeamMemberRepositoryPort teamMemberRepository;
    private final TeamRepositoryPort teamRepository;
    private final AuditLogRepositoryPort auditLogRepository;
    private final CacheManager cacheManager;
    private final HolidayCalendarPort holidayCalendarPort;
    private final TeamSectorOptionRepositoryPort teamSectorOptionRepository;

    public JiraSyncProcessor(JiraGatewayPort jiraGatewayPort, WorkItemRepositoryPort workItemRepository,
                                    TeamMemberRepositoryPort teamMemberRepository, TeamRepositoryPort teamRepository,
                                    AuditLogRepositoryPort auditLogRepository, CacheManager cacheManager,
                                    HolidayCalendarPort holidayCalendarPort,
                                    TeamSectorOptionRepositoryPort teamSectorOptionRepository) {
        this.jiraGatewayPort = jiraGatewayPort;
        this.workItemRepository = workItemRepository;
        this.teamMemberRepository = teamMemberRepository;
        this.teamRepository = teamRepository;
        this.auditLogRepository = auditLogRepository;
        this.cacheManager = cacheManager;
        this.holidayCalendarPort = holidayCalendarPort;
        this.teamSectorOptionRepository = teamSectorOptionRepository;
    }

    @Async(JiraSyncAsyncConfig.EXECUTOR_BEAN)
    public void onSyncRequested(JiraSyncRequestedMessage message) {
        log.info("Jira sync istegi alindi: teamId={}, project={}", message.teamId(), message.jiraProjectKey());

        List<JiraIssueSnapshot> issues;
        try {
            issues = jiraGatewayPort.fetchIssues(
                    new JiraGatewayPort.JiraFetchQuery(message.jiraProjectKey(), message.jql()));
        } catch (RuntimeException e) {
            log.error("Jira'dan issue cekilemedi. teamId={}, project={}", message.teamId(), message.jiraProjectKey(), e);
            recordAudit(message.teamId(), false, "Jira'dan veri cekilemedi: " + e.getMessage());
            throw e; // @Async istisna isleyicisine gider (bkz. JiraSyncAsyncConfig) - basarisizlik ayrica audit_log.a da yazildi
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

        // roster_locked=true olan takimlarda (bkz. V21 migration, Team.rosterLocked)
        // Jira sync ARTIK HICBIR YENI TeamMember otomatik olusturmaz - "en az N is
        // kalemi" esigi (asagida) DENENDI ama yetersiz kaldi: RPA'da bazi kisiler
        // (Edip Yemen: 50, Aysegul Ay: 80 is kalemi) esigi rahatca gecmesine ragmen
        // gercek takim uyesi degildi - item sayisi bu takim icin guvenilir bir
        // sinyal degil (bkz. kullanici bildirimi, 2026-08-17: "iki kişi mock
        // ekleyip silmemişsin böyle kişiler yok bu takımda"). Roster'i kilitli
        // takimlarda yeni bir kisi gercekten katilirsa PO/admin POST
        // /api/teams/{teamId}/members ile elle ekler.
        boolean rosterLocked = teamRepository.findById(message.teamId())
                .map(com.aksa.capacityplanner.team.domain.Team::isRosterLocked).orElse(false);

        // Roster KILITLI DEGILSE: karsiligi olmayan bir assignee, SADECE bu sync
        // batch'inde en az MIN_ITEMS_FOR_AUTO_PROVISION is kalemine sahipse yeni
        // takim uyesi olarak otomatik eklenir (bkz. provisionTeamMember
        // cagrisindaki kontrol) - aksi halde o is kalemleri "atanmamis"
        // (team_member_id=null) kalir: takim toplamina girer ama kisi bazli
        // satirlarda gorunmez.
        Map<String, Long> assigneeItemCounts = new java.util.HashMap<>();
        for (JiraIssueSnapshot issue : issues) {
            TeamMemberMatcher.JiraAssignee a = TeamMemberMatcher.extractAssignee(issue.fieldValues().get("assignee"));
            if (a != null && a.accountId() != null) {
                assigneeItemCounts.merge(a.accountId(), 1L, Long::sum);
            }
        }

        // Sektor (customfield_10498) bazi takimlarda (DA/DSYS/YZ, canli DB
        // incelemesiyle dogrulandi - bkz. kullanici bildirimi 2026-08-18)
        // Gorev/Alt Gorev seviyesinde HIC dolu degil, sadece bagli Epic'te
        // var. Kendi alani bos olan HER issue icin (takimdan bagimsiz, genel
        // kural) bagli Epic'in (parent) sektorunu tek seferde topluca cekip
        // resolveSector'a besleriz - alani zaten dolu olan takimlarda (RPA/
        // IZ/SD) bu harita hic devreye girmez.
        Map<String, String> epicSectorByKey = resolveEpicSectors(issues);

        // Icerik Slayti "Tamamlanan Isler" kutusu, bir takimin KENDI Jira proje
        // anahtariyla (orn. "RPA") etiketledigi Epic'lerin altindaki isleri elemek
        // icin ust ogenin (Epic) Labels alanina ihtiyac duyar - bkz.
        // jiraContentMapper.js, kullanici teyidi 2026-08-20: "label ında takımın
        // adı yazan epicteki işler gelmeyecek" (orn. RPA-2206 "RPA Ekibi Agile
        // Toplantılar" / RPA-949 "RPA Ekibi PO" - ikisi de "RPA" label'i tasiyor,
        // gercek teslim edilen is degil idari/toplanti isleri). Sektor cozumunden
        // FARKLI olarak HER Epic icin cekilir (sadece eksik olanlar degil).
        Map<String, String> epicLabelsByKey = resolveEpicLabels(issues);

        // "Bir onceki sprint" (bkz. PO notu 2026-08-19) TEK BIR issue'ya
        // bakarak bulunamaz - bir issue'nun sprint listesindeki "closed"
        // kayitlar onun kendi gecmisidir, TAKIMIN en son kapanan sprinti
        // degil. Bu yuzden once TUM issue'larin sprint kayitlari taranip
        // bitis tarihi en yeni olan kapali sprint bulunur, sonra her issue
        // bu sprintte yer alip almadigina gore isaretlenir.
        Long previousSprintId = resolvePreviousSprintId(issues);

        int upserted = 0;
        int failed = 0;
        int newlyProvisioned = 0;
        Set<String> sectorsSeen = new HashSet<>();
        for (JiraIssueSnapshot issue : issues) {
            try {
                boolean wasNewMember = upsert(message.teamId(), message.jiraProjectKey(), issue, teamMembers,
                        assigneeItemCounts, rosterLocked, epicSectorByKey, epicLabelsByKey, sectorsSeen, previousSprintId);
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
            // Icerik Slayti'ndaki "Sektor (ops.)" dropdown'unun kaynagi (bkz.
            // TeamController.listSectorOptions) - takimin Jira'daki GUNCEL
            // sektor kumesiyle her sync'te TAMAMEN degistirilir.
            teamSectorOptionRepository.replaceAll(message.teamId(), sectorsSeen);
        }
        if (newlyProvisioned > 0 || upserted > 0) {
            evictTeamMembersCache(message.teamId());
        }
    }

    /**
     * Kendi Sektor alani (customfield_10498) bos olan issue'larin bagli
     * Epic'inin (parent) sektorunu tek toplu Jira sorgusuyla cozer - bkz.
     * JiraGatewayPort.fetchSectorByIssueKeys. Zaten dolu issue'lar (RPA/IZ/SD
     * gibi Gorev seviyesinde tutan takimlar) bu sorguya hic girmez.
     */
    private Map<String, String> resolveEpicSectors(List<JiraIssueSnapshot> issues) {
        Set<String> epicKeys = new HashSet<>();
        for (JiraIssueSnapshot issue : issues) {
            if (extractOptionFieldValue(issue.fieldValues().get("customfield_10498")) != null) {
                continue;
            }
            String parentKey = extractParentKey(issue.fieldValues());
            if (parentKey != null) {
                epicKeys.add(parentKey);
            }
        }
        if (epicKeys.isEmpty()) {
            return Map.of();
        }
        return jiraGatewayPort.fetchSectorByIssueKeys(new java.util.ArrayList<>(epicKeys));
    }

    /**
     * Bu senkron partisindeki TUM issue'larin bagli oldugu Epic'lerin Labels
     * alanini tek toplu Jira sorgusuyla getirir - bkz. yukaridaki cagri
     * yerindeki not. resolveEpicSectors'tan farkli olarak KOSULSUZ (her
     * parent icin) cekilir; her Epic'in genelde 1-2 label'i oldugu icin
     * maliyeti onemsiz.
     */
    private Map<String, String> resolveEpicLabels(List<JiraIssueSnapshot> issues) {
        Set<String> epicKeys = new HashSet<>();
        for (JiraIssueSnapshot issue : issues) {
            String parentKey = extractParentKey(issue.fieldValues());
            if (parentKey != null) {
                epicKeys.add(parentKey);
            }
        }
        if (epicKeys.isEmpty()) {
            return Map.of();
        }
        return jiraGatewayPort.fetchLabelsByIssueKeys(new java.util.ArrayList<>(epicKeys));
    }

    private String extractParentKey(Map<String, Object> fields) {
        if (fields.get("parent") instanceof Map<?, ?> parent) {
            Object key = parent.get("key");
            return key != null ? String.valueOf(key) : null;
        }
        return null;
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

    /**
     * TeamMemberService.listByTeam() @Cacheable("team-members-by-team") - bu
     * sinif provisionTeamMember/backfillJiraIdentity'de teamMemberRepository'yi
     * DOGRUDAN cagirir (TeamMemberService'i, dolayisiyla onun @CacheEvict'lerini
     * BYPASS eder). Bu cache onceden (orn. sync BASLAMADAN once bir dashboard
     * gorunumu acilmisti) zaten ISINMISSA, Jira'dan yeni otomatik eklenen
     * kisiler - is kalemleri/dashboard sayilari dogru guncellense bile - "Kişi
     * Bazlı Kapasite Özeti" tablosunda TTL dolana (veya backend yeniden
     * baslayana) kadar hic gorunmezdi (bkz. kullanici bildirimi, 2026-08-18:
     * "ekip üyeleri gelmiyor hala" - work_items/uye sayisi DB'de dogruydu, sadece
     * bu cache bayattı).
     */
    private void evictTeamMembersCache(Long teamId) {
        Cache cache = cacheManager.getCache("team-members-by-team");
        if (cache != null) {
            cache.evict(teamId);
        }
    }

    /** Jira'nin saniye cinsinden tuttugu sure alanlarini gun'e cevirirken kullanilan is gunu uzunlugu (Jira Cloud varsayilani). */
    private static final BigDecimal SECONDS_PER_WORK_DAY = BigDecimal.valueOf(8L * 60 * 60);
    /** customfield_10503 (Efor A/DK) dakika cinsinden - gune cevirirken bolunecek is gunu uzunlugu (8 saat = 480 dk). */
    private static final BigDecimal MINUTES_PER_WORK_DAY = BigDecimal.valueOf(480L);

    /** Roster'da karsiligi olmayan bir kisinin YENI takim uyesi sayilmasi icin bu sync batch'inde sahip olmasi gereken minimum is kalemi sayisi. */
    private static final long MIN_ITEMS_FOR_AUTO_PROVISION = 10;

    /** @return bu issue icin YENI bir TeamMember otomatik olusturulduysa true (audit ozetinde sayilir). */
    private boolean upsert(Long teamId, String jiraProjectKey, JiraIssueSnapshot issue, List<TeamMember> teamMembers,
                            Map<String, Long> assigneeItemCounts, boolean rosterLocked,
                            Map<String, String> epicSectorByKey, Map<String, String> epicLabelsByKey,
                            Set<String> sectorsSeen, Long previousSprintId) {
        // Jira'nin kendi statu adlari (orn. "PROD", "Açık") uygulamanin
        // status_options.code degerleriyle (orn. "Canlı", "Backlog") birebir
        // AYNI degil - dogrudan issue.statusName() yazmak V8'deki
        // chk_work_items_status_code kontrolunu her satirda ihlal ediyordu.
        String appStatusCode = JiraStatusMapper.resolve(jiraProjectKey, issue.statusName());
        BigDecimal plannedEffortDays = extractPlannedEffortDays(issue.fieldValues());
        // TUM PROJELER ICIN: bir hikayenin kendi customfield_10503'u genelde
        // ya BOS (gercek efor sadece alt gorevlerde - orn. SD-1733) ya da alt
        // gorevlerin TOPLAMIDIR (orn. RPA) - ikisinde de kisiye ozel degildir.
        // Alt gorevi OLAN bir parent'ta bu degeri aynen kullanmak, ya hicbir
        // seyi (bos oldugu icin) ya da eforu iki kere (parent + her alt gorev
        // ayri ayri) saymak anlamina gelir. Gercek kisi bazli efor alt gorev
        // seviyesinde (kendi assignee'si, kendi customfield_10503'uyle) zaten
        // ayrica geliyor - bu yuzden alt gorevi olan parent'larin kendi eforu
        // burada BILEREK 0'a sabitlenir (bkz. kullanici bildirimi, 2026-08-14 -
        // "efor lari epiclere ya da islere girmis olabilirler... subtasklara
        // da bakabilirsin"; IZ/YZ'de hic alt gorev olmadigi icin bu kural
        // onlar icin etkisizdir).
        if (hasSubtasks(issue.fieldValues())) {
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
            } else if (!rosterLocked && assignee.accountId() != null
                    && assigneeItemCounts.getOrDefault(assignee.accountId(), 0L) >= MIN_ITEMS_FOR_AUTO_PROVISION) {
                TeamMember created = provisionTeamMember(teamId, assignee);
                teamMembers.add(created);
                teamMemberId = created.getId();
                createdNewMember = true;
            }
            // esikten dusuk (veya accountId'siz) assignee: teamMemberId null kalir -
            // is kalemi takim toplamina girer ama kisi bazli satirlarda gorunmez.
        }

        WorkItem workItem = workItemRepository.findByJiraIssueKey(issue.issueKey())
                .orElseGet(() -> new WorkItem(null, teamId, null, issue.summary(), issue.issueKey(),
                        BigDecimal.ZERO, appStatusCode, WorkItemSource.JIRA, LocalDate.now(), null,
                        false, null, null, null, false, null, null, false, null, null, null, null));
        workItem.setTitle(issue.summary());
        workItem.setStatusCode(appStatusCode);
        workItem.setPlannedEffortDays(plannedEffortDays);
        workItem.setTeamMemberId(teamMemberId);
        workItem.setFlagged(extractFlagged(issue.fieldValues()));
        String sector = resolveSector(issue, epicSectorByKey);
        workItem.setSector(sector);
        if (sector != null) {
            sectorsSeen.add(sector);
        }
        workItem.setPriority(extractPriorityName(issue.fieldValues().get("priority")));
        ActiveSprintInfo sprintInfo = extractActiveSprint(issue.fieldValues());
        workItem.setSprintName(sprintInfo.name());
        workItem.setActiveSprint(sprintInfo.active());
        workItem.setSprintStartDate(sprintInfo.startDate());
        workItem.setSprintEndDate(sprintInfo.endDate());
        workItem.setPreviousSprint(previousSprintId != null && belongsToSprint(issue.fieldValues(), previousSprintId));
        // Icerik Slayti artik tek tek Gorev/Story'leri degil bunlarin UST OGESINI
        // (Epic) gosterir - bkz. jiraContentMapper.js. Jira'nin arama yaniti
        // "parent" alanini fields.summary ile birlikte dondurdugu icin baslik
        // ek bir istek olmadan buradan alinir.
        workItem.setIssueType(extractIssueTypeName(issue.fieldValues().get("issuetype")));
        workItem.setParentKey(extractParentKey(issue.fieldValues()));
        workItem.setParentTitle(extractParentTitle(issue.fieldValues()));
        String parentKeyForLabels = extractParentKey(issue.fieldValues());
        workItem.setParentLabels(parentKeyForLabels != null ? epicLabelsByKey.get(parentKeyForLabels) : null);
        // "Ekleniş tarihine göre siralama" (bkz. SuggestionList.jsx) ve
        // "Yeni Eklenen İş Yükü" KPI'i icin gercek Jira olusturulma tarihi
        // kullanilir - eskiden added_date HER ZAMAN senkronizasyon gunune
        // (LocalDate.now()) esitti, yani her sync'te tum isler "bugun
        // eklenmis" gibi gorunuyordu.
        LocalDate createdDate = parseJiraDate(issue.fieldValues().get("created"));
        if (createdDate != null) {
            workItem.setAddedDate(createdDate);
        }
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
     * Jira'nin "Flagged" alani (customfield_10021) - multicheckboxes/array tipi
     * (bkz. Jira field discovery, 2026-08-17: schema.type="array", items="option").
     * Herhangi bir secenek isaretliyse (bos olmayan liste) flagged=true - Jira'da
     * bu, kartin uzerindeki bayrak ikonuna karsilik gelir (genelde "engel/dikkat"
     * anlaminda kullanilir, bkz. İçerik Slaytı "Riskler" kutusu esleme kurali).
     */
    private boolean extractFlagged(Map<String, Object> fields) {
        Object raw = fields.get("customfield_10021");
        return raw instanceof List<?> list && !list.isEmpty();
    }

    /** Jira'nin "Sprint" (gh-sprint) ozel alani - bkz. JiraRestClientAdapter.DEFAULT_FIELDS. */
    private static final String SPRINT_FIELD_ID = "customfield_10020";

    private record ActiveSprintInfo(String name, boolean active, LocalDate startDate, LocalDate endDate) {
        static final ActiveSprintInfo NONE = new ActiveSprintInfo(null, false, null, null);
    }

    /**
     * Jira'nin "Sprint" alani, issue'nun BUGUNE KADAR gectigi TUM sprint'lerin
     * listesini doner (orn. bir onceki sprintten devreden bir is kalemi 2 kayit
     * tasiyabilir), her biri kendi "state" (active/closed/future) degeriyle -
     * bkz. GET /rest/agile/1.0/board/{id}/sprint?state=active ile ayni model
     * (JiraDiscoveryService.getActiveSprint). Icerik Slayti'nin HEDEFLER cubugu
     * icin sadece SU AN "active" olan sprint anlamlidir; listede boyle bir kayit
     * yoksa (backlog'da bekleyen veya gecmis/kapali sprintlerde kalmis bir is
     * kalemi) NONE donulur - buildBandTargetsFromWorkItems (frontend) bu is
     * kalemini guncel sprint sayimina DAHIL ETMEZ.
     *
     * Eski Jira surumlerinde bu alan duz metin (greenhopper toString cikti)
     * olarak da gelebilir ("...,state=ACTIVE,name=...]") - REST API v3/agile
     * 1.0 kombinasyonunda bu artik beklenmez (gercek Map/List doner), bu yuzden
     * SADECE Map/List sekli desteklenir; beklenmedik bir format sessizce NONE
     * sayilir (senkronizasyonu bu yuzden durdurmaz).
     */
    private ActiveSprintInfo extractActiveSprint(Map<String, Object> fields) {
        for (SprintRef ref : sprintRefs(fields)) {
            if ("active".equalsIgnoreCase(ref.state())) {
                return new ActiveSprintInfo(ref.name(), true, ref.startDate(), ref.endDate());
            }
        }
        return ActiveSprintInfo.NONE;
    }

    /** Jira "Sprint" (gh-sprint) alanindaki tek bir sprint kaydi. */
    private record SprintRef(Long id, String name, String state, LocalDate startDate, LocalDate endDate) {
    }

    /**
     * Bir issue'nun Jira "Sprint" alanindaki TUM sprint kayitlarini cozer
     * (issue bir onceki sprintten devrettiyse birden fazla olabilir).
     * Beklenmedik bir bicim sessizce atlanir - senkronizasyonu durdurmaz.
     */
    @SuppressWarnings("unchecked")
    private List<SprintRef> sprintRefs(Map<String, Object> fields) {
        Object raw = fields.get(SPRINT_FIELD_ID);
        if (!(raw instanceof List<?> sprints)) {
            return List.of();
        }
        List<SprintRef> refs = new java.util.ArrayList<>();
        for (Object entry : sprints) {
            if (!(entry instanceof Map<?, ?> sprint)) {
                continue;
            }
            Map<String, Object> sprintMap = (Map<String, Object>) sprint;
            Object id = sprintMap.get("id");
            Object name = sprintMap.get("name");
            Object state = sprintMap.get("state");
            refs.add(new SprintRef(
                    id instanceof Number n ? n.longValue() : null,
                    name != null ? String.valueOf(name) : null,
                    state != null ? String.valueOf(state) : "",
                    parseJiraDate(sprintMap.get("startDate")),
                    parseJiraDate(sprintMap.get("endDate"))));
        }
        return refs;
    }

    /**
     * Takimin TUM issue'larindaki sprint kayitlarini tarayip "bir onceki
     * sprint"i belirler: state=closed olanlar arasindan bitis tarihi EN YENI
     * olan (bkz. kullanici teyidi 2026-08-20 - "en son kapanan sprint").
     * Hicbir kapali sprint yoksa (yeni board, sprint alani hic dolmamis)
     * null doner ve hicbir is kalemi previousSprint=true isaretlenmez.
     */
    private Long resolvePreviousSprintId(List<JiraIssueSnapshot> issues) {
        SprintRef best = null;
        for (JiraIssueSnapshot issue : issues) {
            for (SprintRef ref : sprintRefs(issue.fieldValues())) {
                if (!"closed".equalsIgnoreCase(ref.state()) || ref.id() == null || ref.endDate() == null) {
                    continue;
                }
                if (best == null || ref.endDate().isAfter(best.endDate())) {
                    best = ref;
                }
            }
        }
        if (best != null) {
            log.info("Bir onceki (en son kapanan) sprint: id={}, name={}, endDate={}", best.id(), best.name(), best.endDate());
        }
        return best != null ? best.id() : null;
    }

    private boolean belongsToSprint(Map<String, Object> fields, Long sprintId) {
        return sprintRefs(fields).stream().anyMatch(ref -> sprintId.equals(ref.id()));
    }

    /** Jira'nin standart "issuetype" alanindan tip adini ("Görev"/"Story"/"Alt görev") okur. */
    private String extractIssueTypeName(Object rawField) {
        if (rawField instanceof Map<?, ?> map) {
            Object name = map.get("name");
            return name != null ? String.valueOf(name) : null;
        }
        return null;
    }

    /**
     * Ust ogenin (parent - genelde Epic) BASLIGI. Jira arama yaniti parent'i
     * ic ice bir "fields" nesnesiyle dondurur ({key, fields:{summary,...}}),
     * bu yuzden ayrica bir istek atmaya gerek yoktur.
     */
    @SuppressWarnings("unchecked")
    private String extractParentTitle(Map<String, Object> fields) {
        if (fields.get("parent") instanceof Map<?, ?> parent) {
            Object nested = ((Map<String, Object>) parent).get("fields");
            if (nested instanceof Map<?, ?> parentFields) {
                Object summary = ((Map<String, Object>) parentFields).get("summary");
                if (summary != null) {
                    return String.valueOf(summary);
                }
            }
        }
        return null;
    }

    /**
     * Jira'nin sprint "startDate"/"endDate" alanlari ISO-8601 zaman damgasi
     * olarak gelir (orn. "2026-08-10T07:00:00.000Z") - sadece tarih kismi
     * (kapak/rapor tarih araligi icin) kullanilir, saat/dilim atilir. Format
     * beklenmedik olursa (null/bos/parse hatasi) sessizce null donulur -
     * senkronizasyonu durdurmaz (extractActiveSprint'in genel kuraliyla ayni).
     */
    private LocalDate parseJiraDate(Object raw) {
        if (raw == null) {
            return null;
        }
        String value = String.valueOf(raw);
        try {
            return java.time.OffsetDateTime.parse(value).toLocalDate();
        } catch (java.time.format.DateTimeParseException ignored) {
            // Jira'nin "created"/"updated" alanlari saat dilimini ISO'nun
            // bekledigi "+03:00" yerine "+0300" bicimiyle dondurur - bu
            // durumda sadece tarih onekini (ilk 10 karakter) okuruz.
        }
        try {
            return value.length() >= 10 ? LocalDate.parse(value.substring(0, 10)) : null;
        } catch (java.time.format.DateTimeParseException e) {
            return null;
        }
    }

    /** Jira'nin "option" (select/dropdown) tipi ozel alanlarindan ("value" anahtari, orn. Sektör) deger okur. */
    private String extractOptionFieldValue(Object rawField) {
        if (rawField instanceof Map<?, ?> map) {
            Object value = map.get("value");
            return value != null ? String.valueOf(value) : null;
        }
        return null;
    }

    /**
     * Sektor (customfield_10498) - kendi alani doluysa dogrudan onu kullanir;
     * bosa (DA/DSYS/YZ gibi takimlarda Gorev/Alt Gorev seviyesinde hic
     * doldurulmuyor - bkz. resolveEpicSectors) bagli Epic'ten onceden toplu
     * cozulmus degere duser.
     */
    private String resolveSector(JiraIssueSnapshot issue, Map<String, String> epicSectorByKey) {
        String direct = extractOptionFieldValue(issue.fieldValues().get("customfield_10498"));
        if (direct != null) {
            return direct;
        }
        String parentKey = extractParentKey(issue.fieldValues());
        return parentKey != null ? epicSectorByKey.get(parentKey) : null;
    }

    /** Jira'nin standart "priority" alani "value" degil "name" anahtari kullanir (custom "option" alanlarindan farkli). */
    private String extractPriorityName(Object rawField) {
        if (rawField instanceof Map<?, ?> map) {
            Object name = map.get("name");
            return name != null ? String.valueOf(name) : null;
        }
        return null;
    }

    /**
     * Takim rosterinde (team_members) karsiligi olmayan gercek bir Jira katilimcisi icin
     * yeni bir TeamMember olusturur - referans "Jira Dashboard" projesindeki gibi, uyelik
     * manuel bir listeye degil dogrudan Jira'nin kendisine dayanir. role/startDate/statusCode
     * bilerek bos birakilir (Jira bu bilgileri saglamaz) - takim yoneticisi sonradan doldurabilir.
     */
    private TeamMember provisionTeamMember(Long teamId, TeamMemberMatcher.JiraAssignee assignee) {
        // startDate bilinmedigi (Jira bu bilgiyi saglamaz) icin TargetWorkDaysCalculator
        // hep varsayilan DEFAULT_FULL_PERIOD_TARGET_DAYS'i (145) doner - TeamMemberService.addMember
        // (elle "Ekip üyesi ekle") ile AYNI kural. Eskiden burada targetWorkDays hep null
        // kaliyordu (dogrudan repository.save ile TeamMemberService'i BYPASS ediyordu) - bu da
        // Kullanılabilir Kapasite'yi (Hedef - Gecen - Izin) HER ZAMAN 0 gosteriyordu (bkz.
        // kullanici bildirimi, 2026-08-18: "kullanılabilir kapasite ... boş geliyor").
        int year = LocalDate.now().getYear();
        BigDecimal defaultTarget = TargetWorkDaysCalculator.calculateDefault(null, year,
                holidayCalendarPort.getFullDayHolidays(year), holidayCalendarPort.getHalfDayHolidays(year));
        TeamMember member = new TeamMember(null, teamId, assignee.displayName(), null, assignee.email(),
                null, null, defaultTarget, false);
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
