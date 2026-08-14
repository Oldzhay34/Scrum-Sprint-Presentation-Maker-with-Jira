package com.aksa.capacityplanner.jiraintegration.domain;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * Jira issue statusunu (issue.fields.status.name) uygulamanin kendi
 * status_options.code degerine cevirir.
 *
 * TAKIM BAZLI: ayni ham Jira statusu ("PAUSE", "Tamam" vb.) FARKLI takimlarda
 * FARKLI anlamlara gelebiliyor - orn. YZ'de "PAUSE" tamamlanmis sayilirken,
 * IZ'de "PAUSE" acik/bekleyen sayiliyor. Eskiden burada TEK, takim-bagimsiz bir
 * harita vardi; bu Urun Gelistirme (SD) takiminin gercek "Tamamlandı" statusunu
 * (haritada sadece "Tamam" vardi, "Tamamlandı" degil) hic taniyamiyordu - 532
 * is kaleminin TAMAMI "Backlog"a dusuyor, "Tamamlanan (AG)" kartinda herkes 0
 * gorunuyordu (bkz. kullanici bildirimi, 2026-08-14).
 *
 * Kategori listeleri, referans "Jira Dashboard" projesindeki
 * server/db/seedData/boardConfig.js dosyasindan (canli Jira verisiyle
 * dogrulanmis) birebir alinmistir - o proje aynen bu listelerle
 * categorizeStatus() yapiyor (bkz. shared/metrics/statusUtils.js, TAM ESLESME,
 * case-sensitive). Kategori -> uygulama kodu eslemesi:
 *   done -> Canlı (counts_as_completed=true), in_progress -> Devam Ediyor,
 *   testing -> UAT, analysis -> Analiz, open/eslenmeyen -> Backlog.
 */
public final class JiraStatusMapper {

    private static final Logger log = LoggerFactory.getLogger(JiraStatusMapper.class);

    /** Hicbir takim listesinde bulunamayan (veya proje anahtari bilinmeyen) bir statu icin dusulecek notr varsayilan. */
    private static final String UNMAPPED_FALLBACK = "Backlog";

    private static final Map<String, String> CATEGORY_TO_APP_CODE = Map.of(
            "done", "Canlı",
            "in_progress", "Devam Ediyor",
            "testing", "UAT",
            "analysis", "Analiz",
            "open", "Backlog");

    private static final Map<String, Map<String, List<String>>> STATUS_MAPPING_BY_PROJECT_KEY = Map.of(
            "RPA", Map.of(
                    "done", List.of("Tamamlandı", "Done", "Resolved", "Closed", "Bitti", "tamamlandı", "tamam", "Tamam", "Prod", "PROD"),
                    "in_progress", List.of("Devam Ediyor", "DEVELOPMENT"),
                    "open", List.of("Açık", "Yapılacaklar"),
                    "testing", List.of("UAT"),
                    "analysis", List.of("ANALYSIS", "Ön Analiz")),
            "DA", Map.of(
                    "done", List.of("Tamamlandı", "Done", "Resolved", "Closed", "Bitti", "tamamlandı", "tamam", "Tamam", "Prod", "PROD"),
                    "in_progress", List.of("Devam Ediyor", "In Progress", "Ready for Development"),
                    "open", List.of("Açık", "Yapılacaklar", "To Do"),
                    "testing", List.of("UAT", "In UAT", "Test"),
                    "analysis", List.of("ANALYSIS", "Pre-Analysis")),
            "DSYS", Map.of(
                    "done", List.of("Tamamlandı", "Done", "Resolved", "Closed", "Bitti", "tamamlandı", "tamam", "Tamam", "Prod", "PROD"),
                    "in_progress", List.of("Devam Ediyor", "In Progress", "Geliştirme", "DEVELOPMENT"),
                    "open", List.of("Açık", "To Do"),
                    "testing", List.of("UAT", "Test"),
                    "analysis", List.of("Analysis", "Analiz", "Ön Analiz", "ANALYSIS")),
            "IZ", Map.of(
                    "done", List.of("Tamam", "Tamamlandı", "Done", "Canlı", "PROD"),
                    "in_progress", List.of("Devam Ediyor", "In Progress"),
                    "open", List.of("Açık", "To Do", "BACKLOG", "PAUSE"),
                    "testing", List.of("UAT", "Test"),
                    "analysis", List.of("ANALYSIS", "Analiz", "RIPENING")),
            "SD", Map.of(
                    "done", List.of("Tamamlandı"),
                    "in_progress", List.of("Devam Ediyor", "Ready for Development"),
                    "open", List.of("Açık"),
                    "testing", List.of("UAT", "In UAT"),
                    "analysis", List.of("ANALYSIS", "Pre-Analysis")),
            "YZ", Map.of(
                    "done", List.of("Tamam", "Tamamlandı", "Done", "Canlı", "PROD", "PAUSE"),
                    "in_progress", List.of("Devam Ediyor", "In Progress", "Geliştirme"),
                    "open", List.of("Açık", "To Do"),
                    "testing", List.of("UAT", "IN UAT", "Test"),
                    "analysis", List.of("Analysis", "Analiz")));

    private JiraStatusMapper() {
    }

    /**
     * jiraStatusName null/bos ise de UNMAPPED_FALLBACK doner. jiraProjectKey icin
     * takim-ozgu bir liste yoksa (bilinmeyen/yeni proje) da UNMAPPED_FALLBACK'e
     * dusulur - bu durum loglanir ki fark edilsin.
     */
    public static String resolve(String jiraProjectKey, String jiraStatusName) {
        if (jiraStatusName == null || jiraStatusName.isBlank()) {
            return UNMAPPED_FALLBACK;
        }
        Map<String, List<String>> categories = STATUS_MAPPING_BY_PROJECT_KEY.get(jiraProjectKey);
        if (categories == null) {
            log.warn("'{}' icin takim-ozgu statu haritasi yok - '{}' statusu '{}' olarak isleniyor.",
                    jiraProjectKey, jiraStatusName, UNMAPPED_FALLBACK);
            return UNMAPPED_FALLBACK;
        }
        for (Map.Entry<String, List<String>> entry : categories.entrySet()) {
            if (entry.getValue().contains(jiraStatusName)) {
                return CATEGORY_TO_APP_CODE.get(entry.getKey());
            }
        }
        log.warn("Eslenmeyen Jira statusu '{}' (proje={}) - '{}' olarak isleniyor. JiraStatusMapper'a bir satir eklenmeli.",
                jiraStatusName, jiraProjectKey, UNMAPPED_FALLBACK);
        return UNMAPPED_FALLBACK;
    }
}
