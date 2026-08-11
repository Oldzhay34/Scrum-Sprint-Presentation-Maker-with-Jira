import Button from "../shared/Button";
import ErrorBanner from "../shared/ErrorBanner";
import { IconRefresh } from "../shared/icons";

/**
 * Kapasite Dashboard'un "Jira'dan" sekmesi: veri girilmez, sadece backend'de
 * zaten kayıtlı (üst çubuktaki "Jira'dan Çek" ile senkronize edilmiş) veriler
 * "Yenile" ile okunur. Excel/Manuel'den farkı budur - bu sekmede kullanıcı
 * hiçbir alan doldurmaz.
 */
export default function JiraDashboardPanel({ j }) {
  return (
    <div className="bandpanel">
      <div className="dashinfo">{j.loading ? "Okunuyor…" : j.info}</div>
      {j.error && <ErrorBanner error={j.error} />}
      <div className="deltagrid" style={{ marginTop: 10 }}>
        <div className="field">
          <label>Ekip adı</label>
          <input value={j.team} onChange={(e) => j.setTeam(e.target.value)} placeholder="örn: RPA Ekibi" />
        </div>
        <div className="field">
          <label>
            Sprint No <span className="opt">opsiyonel</span>
          </label>
          <input value={j.sprintNo} onChange={(e) => j.setSprintNo(e.target.value)} placeholder="örn: 7" />
        </div>
        <div className="field">
          <label>Dönem başlangıcı</label>
          <input type="date" value={j.period.periodStart} onChange={(e) => j.setPeriod((p) => ({ ...p, periodStart: e.target.value }))} />
        </div>
        <div className="field">
          <label>Dönem bitişi</label>
          <input type="date" value={j.period.periodEnd} onChange={(e) => j.setPeriod((p) => ({ ...p, periodEnd: e.target.value }))} />
        </div>
        <div className="field">
          <label>Rapor tarihi</label>
          <input type="date" value={j.period.reportDate} onChange={(e) => j.setPeriod((p) => ({ ...p, reportDate: e.target.value }))} />
        </div>
      </div>
      <Button variant="primary" loading={j.loading} loadingLabel="Okunuyor…" onClick={j.refresh} style={{ marginTop: 12 }}>
        <IconRefresh className="navbar-icon" />
        Yenile
      </Button>
      {j.loaded && j.dashData?.persons?.length === 0 && (
        <p className="opt" style={{ marginTop: 10 }}>
          Henüz kişi ataması yapılmamış — kişi bazlı doluluk/risk tablosu boş görünecek, ama toplam iş yükü sayıları
          gerçek Jira verisidir.
        </p>
      )}
    </div>
  );
}
