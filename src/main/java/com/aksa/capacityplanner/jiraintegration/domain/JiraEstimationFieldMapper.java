package com.aksa.capacityplanner.jiraintegration.domain;

import java.util.Map;

/**
 * Jira proje anahtari -> o board'un "estimation" (efor tahmini) alani olarak
 * kullandigi custom field id'si.
 *
 * RPA ve IZ board'lari zaman takibi (timeoriginalestimate vb.) KULLANMIYOR -
 * ikisi de tum alanlari null donduruyordu (bkz. kullanici bildirimi: "efor hep
 * 0"). GET /rest/agile/1.0/board/{boardId}/configuration ile canli dogrulandi:
 *   - RPA panosu (board 538): estimation.field.fieldId = customfield_10057 ("Story Points")
 *   - IZ panosu (board 1669): estimation.field.fieldId = customfield_10016 ("Story point estimate")
 * Bu ID'ler Jira instance'ina OZGUDUR ve custom field olusturuldukca degisebilir -
 * board konfigurasyonu degisirse (orn. farkli bir alan estimation'a atanirsa)
 * bu esleme de guncellenmelidir.
 *
 * Story Points, tanim geregi zaman degil SOYUT bir buyukluk birimidir; burada
 * 1 Story Point = 1 gun (adam/gun) olarak VARSAYILIR (RPA Excel'indeki "Efor"
 * kolonundaki degerlerle (5-20 araligi) buyukluk mertebesi olarak tutarli).
 * Bu bir donusum katsayisi VARSAYIMIDIR, birebir dogrulanmis degildir - takim
 * farkli bir oran kullaniyorsa JiraSyncRequestConsumer'daki kullanim noktasi
 * (extractPlannedEffortDays) buna gore carpanla guncellenebilir.
 */
public final class JiraEstimationFieldMapper {

    public static final String RPA_STORY_POINTS_FIELD_ID = "customfield_10057";
    public static final String IZ_STORY_POINTS_FIELD_ID = "customfield_10016";

    private static final Map<String, String> ESTIMATION_FIELD_BY_PROJECT_KEY = Map.of(
            "RPA", RPA_STORY_POINTS_FIELD_ID,
            "IZ", IZ_STORY_POINTS_FIELD_ID);

    private JiraEstimationFieldMapper() {
    }

    /** Bilinmeyen bir proje icin null doner - cagiran taraf bu durumda efor cikaramaz, 0'a duser. */
    public static String resolveFieldId(String jiraProjectKey) {
        return ESTIMATION_FIELD_BY_PROJECT_KEY.get(jiraProjectKey);
    }
}
