package com.aksa.capacityplanner.jiraintegration.domain;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Jira issue statusunu (issue.fields.status.name) uygulamanin kendi
 * status_options.code degerine cevirir.
 *
 * Jira'daki gercek statu adlari (RPA ve IZ board'lari, canli senkronizasyonla
 * dogrulandi - bkz. docs/jira-endpoint-plani.md) ile uygulamanin Excel'den
 * gelen "Listeler" sozlugu (bkz. V14__seed_status_options_rpa_iszekasi.sql)
 * FARKLI kelimeler: Jira "PROD" derken uygulama "Canlı" diyor, Jira "Açık"
 * derken uygulama "Backlog" diyor, vb. Bu ceviri katmani olmadan V8'deki
 * chk_work_items_status_code her satirda patlar (bkz. kullanici bildirimi -
 * ilk senkronizasyon denemesinde 2195/2195 issue basarisiz oldu).
 *
 * Esleme MANTIKSAL bir yorumdur, birebir teyit edilmis is akisi degildir -
 * ozellikle "Tamam" -> "Canlı" ve "NOT OK FOR RPA" -> "İptal" varsayimlari
 * takim tarafindan dogrulanmali. Bilinmeyen (haritada olmayan) bir statu
 * gelirse UNMAPPED_FALLBACK'e (Backlog - notr, tamamlanmis SAYILMAYAN bir
 * durum) dusulur ve loglanir; boylece yeni bir Jira statusu eklendiginde
 * senkronizasyon sessizce yanlis sonuc uretmez, gorunur bir sekilde
 * "eslenmeyen statu" olarak isaretlenir.
 */
public final class JiraStatusMapper {

    private static final Logger log = LoggerFactory.getLogger(JiraStatusMapper.class);

    /** Bilinmeyen bir Jira statusu icin dusulecek notr varsayilan - status_options'ta her iki takimda da var. */
    private static final String UNMAPPED_FALLBACK = "Backlog";

    private static final Map<String, String> JIRA_TO_APP_STATUS = Map.ofEntries(
            // Analiz asamasi - "Analiz Havuzu"/"Analiz Onayı" status_options'ta (V14) RPA ve
            // IZ icin tanimli gercek kodlar; Jira board'unda ayni adla bir sutun/statu varsa
            // birebir (identity) eslenir.
            Map.entry("ANALYSIS", "Analiz"),
            Map.entry("Analiz", "Analiz"),
            Map.entry("Analiz Havuzu", "Analiz Havuzu"),
            Map.entry("Analiz Onayı", "Analiz Onayı"),
            Map.entry("Ön Analiz", "Ön Analiz"),

            // Bekleyen/baslamamis is
            Map.entry("Açık", "Backlog"),
            Map.entry("BACKLOG", "Backlog"),
            Map.entry("Backlog", "Backlog"),
            Map.entry("Yapılacaklar", "Backlog"),
            Map.entry("To Do", "Backlog"),
            Map.entry("Beklemeye Alındı", "Beklemede"),
            Map.entry("Müşteri Bekleniyor", "Müşteri Bekleniyor"),

            // Gelistirme/devam eden is
            Map.entry("DEVELOPMENT", "Geliştirme"),
            Map.entry("Geliştirme", "Geliştirme"),
            Map.entry("Geliştirme Havuzu", "Geliştirme Havuzu"),
            Map.entry("Devam Ediyor", "Devam Ediyor"),
            Map.entry("In Progress", "Devam Ediyor"),
            Map.entry("UAT", "UAT"),

            // Tamamlanmis/canliya alinmis is - "Tamam" (Done) icin RPA/IZ
            // baglaminda en yakin karsilik "Canlı" (bir surecin/otomasyonun
            // canliya alinmasi = tamamlanmasi anlamina geliyor); takim bu
            // varsayimi dogrulamali, farkliysa buraya tek satir eklenir.
            Map.entry("PROD", "Canlı"),
            Map.entry("Tamam", "Canlı"),
            Map.entry("Done", "Canlı"),
            Map.entry("Canlı", "Canlı"),
            Map.entry("Canlıda/Y", "Canlıda/Y"),

            // Iptal/reddedilmis
            Map.entry("İptal edildi", "İptal"),
            Map.entry("İptal", "İptal"),
            Map.entry("Cancelled", "İptal"),
            // "RPA icin uygun degil" - otomasyona alinmayacagina karar verilmis,
            // fiilen iptal anlaminda.
            Map.entry("NOT OK FOR RPA", "İptal")
    );

    private JiraStatusMapper() {
    }

    /** jiraStatusName null/bos ise de UNMAPPED_FALLBACK doner - status_code NOT NULL degil ama tutarlilik icin. */
    public static String resolve(String jiraStatusName) {
        if (jiraStatusName == null || jiraStatusName.isBlank()) {
            return UNMAPPED_FALLBACK;
        }
        String mapped = JIRA_TO_APP_STATUS.get(jiraStatusName);
        if (mapped == null) {
            log.warn("Eslenmeyen Jira statusu '{}' - '{}' olarak isleniyor. JiraStatusMapper'a bir satir eklenmeli.",
                    jiraStatusName, UNMAPPED_FALLBACK);
            return UNMAPPED_FALLBACK;
        }
        return mapped;
    }
}
