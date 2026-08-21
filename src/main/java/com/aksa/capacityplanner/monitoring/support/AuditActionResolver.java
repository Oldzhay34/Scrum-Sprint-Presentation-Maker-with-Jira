package com.aksa.capacityplanner.monitoring.support;

import java.util.Map;

/**
 * (HTTP metodu + Spring'in cozdugu route pattern'i) -> insan-okunur eylem
 * bilgisine cevirir. Yeni bir mutasyon endpoint'i eklendiginde buraya bir
 * satir eklemek yeterli - AuditLogInterceptor baska hicbir controller'a
 * dokunmuyor, bu yuzden bu sinif projedeki TUM loglanan eylemlerin tek
 * kaynagi (bkz. monitoring modulu paket-info).
 */
public final class AuditActionResolver {

    public record ActionInfo(String code, String label, String entityType) {
    }

    private static final Map<String, ActionInfo> ROUTES = Map.ofEntries(
            Map.entry("POST /api/auth/login", new ActionInfo("AUTH_LOGIN", "Giriş yapıldı", "AUTH")),
            Map.entry("POST /api/auth/logout", new ActionInfo("AUTH_LOGOUT", "Çıkış yapıldı", "AUTH")),

            Map.entry("PUT /api/presentations", new ActionInfo("PRESENTATION_SAVE", "Sprint sunumu kaydedildi", "PRESENTATION")),
            Map.entry("POST /api/presentations/{id}/versions/{version}/rollback",
                    new ActionInfo("PRESENTATION_ROLLBACK", "Sprint sunumu sürümüne geri dönüldü", "PRESENTATION")),

            Map.entry("POST /api/teams", new ActionInfo("TEAM_CREATE", "Takım oluşturuldu", "TEAM")),
            Map.entry("PUT /api/teams/{id}", new ActionInfo("TEAM_UPDATE", "Takım güncellendi", "TEAM")),
            Map.entry("DELETE /api/teams/{id}", new ActionInfo("TEAM_DELETE", "Takım silindi", "TEAM")),
            Map.entry("POST /api/teams/{teamId}/custom-fields", new ActionInfo("TEAM_CUSTOM_FIELD_CREATE", "Özel alan eklendi", "TEAM")),
            Map.entry("DELETE /api/teams/{teamId}/custom-fields/{fieldId}", new ActionInfo("TEAM_CUSTOM_FIELD_DELETE", "Özel alan silindi", "TEAM")),
            Map.entry("POST /api/teams/{teamId}/statuses", new ActionInfo("STATUS_OPTION_CREATE", "Durum seçeneği eklendi", "TEAM")),
            Map.entry("POST /api/teams/{teamId}/jira-sync", new ActionInfo("JIRA_SYNC", "Jira senkronizasyonu tetiklendi", "TEAM")),

            Map.entry("POST /api/teams/{teamId}/members", new ActionInfo("MEMBER_CREATE", "Ekip üyesi eklendi", "MEMBER")),
            Map.entry("PUT /api/teams/{teamId}/members/{memberId}", new ActionInfo("MEMBER_UPDATE", "Ekip üyesi güncellendi", "MEMBER")),
            Map.entry("PATCH /api/teams/{teamId}/members/{memberId}/status", new ActionInfo("MEMBER_STATUS_CHANGE", "Ekip üyesi durumu değiştirildi", "MEMBER")),
            Map.entry("DELETE /api/teams/{teamId}/members/{memberId}", new ActionInfo("MEMBER_DELETE", "Ekip üyesi silindi", "MEMBER")),

            Map.entry("POST /api/teams/{teamId}/work-items", new ActionInfo("WORKITEM_CREATE", "İş kalemi oluşturuldu", "WORK_ITEM")),
            Map.entry("PUT /api/teams/{teamId}/work-items/{id}", new ActionInfo("WORKITEM_UPDATE", "İş kalemi güncellendi", "WORK_ITEM")),
            Map.entry("PATCH /api/teams/{teamId}/work-items/{id}/status", new ActionInfo("WORKITEM_STATUS_CHANGE", "İş kalemi durumu değiştirildi", "WORK_ITEM")),
            Map.entry("DELETE /api/teams/{teamId}/work-items/{id}", new ActionInfo("WORKITEM_DELETE", "İş kalemi silindi", "WORK_ITEM")),

            Map.entry("POST /api/leave-periods", new ActionInfo("LEAVE_CREATE", "İzin kaydı oluşturuldu", "LEAVE")),
            Map.entry("PUT /api/leave-periods/{id}", new ActionInfo("LEAVE_UPDATE", "İzin kaydı güncellendi", "LEAVE")),
            Map.entry("DELETE /api/leave-periods/{id}", new ActionInfo("LEAVE_DELETE", "İzin kaydı silindi", "LEAVE")),

            Map.entry("POST /api/assets/cover-image", new ActionInfo("ASSET_UPLOAD", "Kapak görseli yüklendi", "ASSET")),
            Map.entry("POST /api/assets/cover-background", new ActionInfo("ASSET_UPLOAD", "Sunum arka planı yüklendi", "ASSET"))
    );

    private AuditActionResolver() {
    }

    /** Bilinmeyen/loglanmasi istenmeyen route'lar icin null doner (interceptor bu durumda satiri atlar). */
    public static ActionInfo resolve(String httpMethod, String pattern) {
        return ROUTES.get(httpMethod + " " + pattern);
    }
}
