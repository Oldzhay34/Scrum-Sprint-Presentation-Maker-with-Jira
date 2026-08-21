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

/** isoDate'den N gun geriye giden ISO tarih dondurur (orn. "2026-08-17" - 14 -> "2026-08-03"). */
function daysBeforeIso(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatTr(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}.${m}.${y}`;
}

/** "PGD Sprint 13" gibi bir Jira sprint adindan sondaki sayiyi cikarir - kapaktaki "Sprint no" alani sadece sayi kabul eder. */
function extractSprintNumber(sprintName) {
  const match = /(\d+)\s*$/.exec(sprintName || "");
  return match ? match[1] : "";
}

/**
 * Kapasite Dashboard'un "Jira'dan" veri kaynağı: Excel/Manuel'in aksine hiçbir
 * veri girilmez - backend'de zaten kayıtlı (Jira'dan Çek ile senkronize edilmiş,
 * bkz. JiraSyncProcessor -> work_items tablosu) verilerden GET
 * /api/teams/{teamId}/capacity-dashboard ile GERÇEK hesaplanmış dashboard'u çeker.
 * "Yenile" ile aynı ekipteki en güncel work_items durumunu tekrar okur - Jira'dan
 * yeniden çekmez (o iş "Jira'dan Çek" butonunun/triggerJiraSync'in işi), sadece
 * DB'de zaten olanı gösterir.
 */
export function useJiraDashboard(team, setTeam, sprintNo, setSprintNo, teamId, teamType, setRange) {
  const [period, setPeriod] = useState(defaultPeriod);
  // Manuel/Excel sekmeleriyle AYNI opsiyonel alan (bkz. useManualDashboard) -
  // doluysa backend Donem Kapanan/Yeni Eklenen/Net Degisim'i is kalemlerinin
  // eklenme/kapanma tarihlerinden hesaplar, buildSummaryCards de bu durumda
  // "Yeni Eklenen İş Yükü" ve "Net İş Yükü Değişimi" kartlarini ekler (bkz. o
  // fonksiyonun yorumu: "HER ZAMAN tam 5 sabit kart"). Jira'da bu ikisi icin
  // ayrilmis bir alan YOK - rapor tarihinden 14 gun oncesi VARSAYILAN olarak
  // otomatik doldurulur (5 kart HER ZAMAN gorunsun diye), kullanici isterse
  // farkli bir tarihe degistirebilir (bkz. kullanici bildirimi, 2026-08-17).
  const [previousSnapshotDate, setPreviousSnapshotDate] = useState(() => daysBeforeIso(defaultPeriod().reportDate, 14));
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
      const dto = await fetchCapacityDashboard(teamId, { ...period, previousSnapshotDate: previousSnapshotDate || undefined });
      // Kapaktaki "Sprint no"/"Tarih araligi" Jira'daki GERCEK aktif sprintten
      // otomatik doldurulur (bkz. kullanici bildirimi, 2026-08-18: sunumda hala
      // eski/manuel girilmis bir sprint numarasi kalabiliyordu, orn. gercekte
      // sprint 13'teyken ekranda "7" gorunmesi). Bu SADECE kapak metnidir -
      // "Donem Baslangic/Bitis" ve kapasite hesabi kasitli olarak degismez
      // (targetWorkDays hala sabit 1 Haziran-31 Aralik donemine gore).
      const effectiveSprintNo = extractSprintNumber(dto.activeSprintName) || sprintNo;
      if (dto.activeSprintName && effectiveSprintNo !== sprintNo) {
        setSprintNo(effectiveSprintNo);
      }
      if (dto.activeSprintStartDate && dto.activeSprintEndDate && setRange) {
        setRange(`${formatTr(dto.activeSprintStartDate)} – ${formatTr(dto.activeSprintEndDate)}`);
      }
      const dd = toDashData(dto, team, effectiveSprintNo, period, previousSnapshotDate, []);
      // "Dönem Kapanan"/"Canlıya Alınan FTE" Jira'da elle girilemez - artik
      // BURADA degil, Canlı Önizleme'deki "Düzenle" ekraninda (dashDataOverride
      // ile) duzenlenir (bkz. DashboardEditModal). FTE SADECE hasFteTracking
      // (RPA) icin "-" placeholder'i ile gosterilir - diger takim tiplerinde
      // bu alan/kavram hic yok, bos ("") birakilirsa DashboardSlideCanvas/
      // dashboardDeckBuilder'daki not satiri filtresi (d.fte !== "") onu
      // otomatik gizler - Excel/Manuel kaynaklarindaki (DeltaForm hasFte)
      // AYNI davranis (bkz. kullanici bildirimi, 2026-08-18: "rpa takımı
      // hariç bu canlıya alınan FTE yazmayacak").
      if (dd.delta && hasFteTracking(teamType)) {
        dd.delta.fte = "-";
      }
      setDashData(dd);
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
    previousSnapshotDate, setPreviousSnapshotDate,
    dashData, loaded, loading, error, refresh,
    info,
  };
}
