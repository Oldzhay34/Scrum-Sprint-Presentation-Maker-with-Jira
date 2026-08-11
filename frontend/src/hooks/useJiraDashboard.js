import { useState } from "react";
import { fetchCapacityDashboard } from "../lib/apiClient";
import { toDashData } from "./useManualDashboard";
import { hasFteTracking } from "../lib/teamTypes";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultPeriod() {
  const year = new Date().getFullYear();
  return { periodStart: `${year}-06-01`, periodEnd: `${year}-12-31`, reportDate: todayIso() };
}

/**
 * Kapasite Dashboard'un "Jira'dan" veri kaynağı: Excel/Manuel'in aksine hiçbir
 * veri girilmez - backend'de zaten kayıtlı (Jira'dan Çek ile senkronize edilmiş,
 * bkz. JiraSyncRequestConsumer -> work_items tablosu) verilerden GET
 * /api/teams/{teamId}/capacity-dashboard ile GERÇEK hesaplanmış dashboard'u çeker.
 * "Yenile" ile aynı ekipteki en güncel work_items durumunu tekrar okur - Jira'dan
 * yeniden çekmez (o iş "Jira'dan Çek" butonunun/triggerJiraSync'in işi), sadece
 * DB'de zaten olanı gösterir.
 */
export function useJiraDashboard(team, setTeam, sprintNo, setSprintNo, teamId, teamType) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [dashData, setDashData] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = async () => {
    if (!teamId) {
      setError("Bu takım için henüz bir takım kaydı (teamId) bulunamadı.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dto = await fetchCapacityDashboard(teamId, period);
      setDashData(toDashData(dto, team, sprintNo, period, "", []));
      setLoaded(true);
    } catch (err) {
      setError(err);
      setDashData(null);
    } finally {
      setLoading(false);
    }
  };

  const info = !loaded
    ? "Önce üst çubuktaki \"Jira'dan Çek\" ile senkronize edin, sonra burada \"Yenile\"ye basın."
    : `Veritabanından okundu — ${dashData?.persons?.length ?? 0} kişi · Rapor Tarihi ${dashData?.reportDate ?? ""}. Kişi ataması yapılmamış Jira iş kalemleri toplam sayılara dahildir ama kişi bazlı satırlarda görünmez.`;

  return {
    team, setTeam, sprintNo, setSprintNo,
    period, setPeriod,
    dashData, loaded, loading, error, refresh,
    info,
    hasFte: hasFteTracking(teamType),
  };
}
