package com.aksa.capacityplanner.capacity.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Kapasite dashboard'unun ham veri birimi (Jira issue analogu).
 * source=MANUAL iken kullanici tarafindan elle girilir; source=JIRA iken
 * ileride JiraGatewayPort uzerinden senkronize edilecek (su an stub).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkItem {

    private Long id;
    private Long teamId;
    /** null ise henuz kisiye atanmamis. */
    private Long teamMemberId;
    private String title;
    /** Jira'dan geldiyse issue key (orn. PROJ-123), manuel girilirse null. */
    private String jiraIssueKey;
    private BigDecimal plannedEffortDays;
    /** team.domain.StatusOption.code degerine referans. */
    private String statusCode;
    private WorkItemSource source;
    private LocalDate addedDate;
    private LocalDate closedDate;
    /**
     * Jira'nin "Flagged" alani (customfield_10021, engel/dikkat isareti) -
     * İçerik Slaytı'nda "Riskler" kutusuna giren is kalemlerini belirler
     * (bkz. JiraSyncProcessor, kullanici bildirimi 2026-08-17: "jira da
     * işlerin yanına flag ekliyor takımlar, flag eklenmiş işler çıksın").
     * MANUAL kaynakli is kalemlerinde her zaman false.
     */
    private boolean flagged;
    /** Jira'nin "Sektör" alani (customfield_10498) - İçerik Slaytı'nda madde etiketi olarak gosterilir. MANUAL/JIRA'da bos olabilir. */
    private String sector;
    /** Jira'nin standart "priority" alani (orn. "Yüksek") - İçerik Slaytı'nda madde etiketi olarak gosterilir. */
    private String priority;
    /**
     * Jira'nin "Sprint" alani (customfield_10020, gh-sprint tipi) - issue'nun icinde
     * bulundugu sprint'in adi (orn. "RPA Sprint 42"). Birden fazla sprint gecmisi varsa
     * (bkz. JiraSyncProcessor.extractActiveSprint) SADECE su an "active" durumdaki
     * sprint yazilir; hicbiri active degilse (backlog/kapali is kalemi) null kalir.
     * MANUAL kaynakli is kalemlerinde her zaman null.
     */
    private String sprintName;
    /**
     * true ise bu is kalemi, Jira'daki GUNCEL aktif sprintin icinde - İçerik Slaytı'nin
     * "HEDEFLER" cubugu (bkz. jiraContentMapper.js buildBandTargetsFromWorkItems) bu
     * alanla sonuclari sprint'e ozgu hale getirir (eskiden TUM tarihsel backlog
     * sayiliyordu - bkz. kullanici bildirimi 2026-08-17: "jiradan bu sprinte özgü
     * olması lazım"). MANUAL kaynakli is kalemlerinde her zaman false.
     */
    private boolean activeSprint;
    /** Jira sprint alanindaki "startDate"/"endDate" (bkz. JiraSyncProcessor.extractActiveSprint) - sadece activeSprint=true iken dolu. */
    private LocalDate sprintStartDate;
    private LocalDate sprintEndDate;
    /**
     * true ise bu is kalemi, takimin EN SON KAPANAN (state=closed, bitiş tarihi en yeni)
     * sprintinde yer aliyor - "bir onceki sprint" karsiligidir (bkz. PO notu 2026-08-19:
     * "Tamamlanan Isler = bir onceki sprintin verilerini icerir"). activeSprint ile ayni
     * anda true olabilir (bir onceki sprintten devreden is kalemleri).
     */
    private boolean previousSprint;
    /**
     * Jira issue tipi ("Gorev"/"Story"/"Alt gorev"/"Epic" ...) - Icerik Slayti'nin ust oge
     * (Epic) listesi SADECE Gorev/Story seviyesindeki kayitlardan turetilir; alt gorevlerin
     * "parent"i Epic degil kendi hikayesidir (bkz. jiraContentMapper.js).
     */
    private String issueType;
    /** Jira'nin "parent" alanindaki ust ogenin (genelde Epic) anahtari - orn. "SD-1670". */
    private String parentKey;
    /** Ust ogenin basligi (Jira arama yaniti parent.fields.summary ile birlikte doner). */
    private String parentTitle;
    /**
     * Ust ogenin (Epic) Jira Labels alani, virgulle ayrilmis (orn. "RPA,Insan Kaynaklari").
     * Icerik Slayti "Tamamlanan Isler" kutusu, bir takimin KENDI adiyla etiketledigi
     * Epic'lerin (orn. RPA'da "RPA Ekibi Agile Toplantilar") altindaki isleri
     * bu alana bakarak eler - bkz. jiraContentMapper.js, kullanici teyidi 2026-08-20.
     * Epic'in labeli yoksa/parent yoksa null.
     */
    private String parentLabels;
}
