package com.aksa.capacityplanner.jiraintegration.domain;

import java.util.Map;

/**
 * Jira'daki efor/buyukluk alanlarinin id'lerini ve cozumleme sirasini tutar.
 *
 * Birincil efor kaynagi ARTIK customfield_10503 (Efor A/DK, DAKIKA) - bkz.
 * JiraSyncProcessor.extractPlannedEffortDays. Bu alan, kullanicinin
 * paylastigi dogrulanmis formul dokumaninda ("dk(issue) = customfield_10503,
 * doluluk = Σ[dk(issue)÷480]") VE full-audit.json'daki PASS sonuclu
 * "capacity-sample-member" kontrolunde teyit edilmistir - TUM takimlar icin
 * (proje bazinda degil) genel gecerlidir.
 *
 * Bu sinif artik SADECE customfield_10503 bos oldugunda dusulecek Story Point
 * fallback zincirini cozumler - yine proje bazinda DEGIL, evrensel bir
 * oncelik sirasiyla: once customfield_10016 ("Story point estimate"), o da
 * bossa customfield_10057 ("Story Points"). Eskiden burada sadece RPA->10057,
 * IZ->10016 sabit esleme vardi; bu DA/DSYS/SD/YZ icin efor'un hep 0 kalmasina
 * yol aciyordu (bkz. kullanici bildirimi - 6 takimin da board id'leri artik
 * elimizde, hepsi icin veri cekilebilmeli).
 */
public final class JiraEstimationFieldMapper {

    /** Efor (A/DK) - dakika. Doluluk/efor hesabinin birincil kaynagi (tum takimlar). */
    public static final String EFFORT_MINUTES_FIELD_ID = "customfield_10503";
    /** Story point estimate - SP kaynagi, customfield_10503 bossa kullanilir (birincil fallback). */
    public static final String STORY_POINTS_PRIMARY_FIELD_ID = "customfield_10016";
    /** Story Points - SP kaynagi, 10016 da bossa kullanilir (ikincil fallback). */
    public static final String STORY_POINTS_FALLBACK_FIELD_ID = "customfield_10057";

    private JiraEstimationFieldMapper() {
    }

    /** customfield_10016 varsa onu, yoksa customfield_10057'yi, ikisi de yoksa null doner. */
    public static Number resolveStoryPoints(Map<String, Object> fields) {
        if (fields.get(STORY_POINTS_PRIMARY_FIELD_ID) instanceof Number primary) {
            return primary;
        }
        if (fields.get(STORY_POINTS_FALLBACK_FIELD_ID) instanceof Number fallback) {
            return fallback;
        }
        return null;
    }
}
