import Button from "../shared/Button";
import ErrorBanner from "../shared/ErrorBanner";
import { IconRefresh } from "../shared/icons";

/**
 * Kartin herhangi bir bos noktasina (input/select'in disina) tiklaninca da
 * kendi input/select'ini odaklar - kucuk alan yerine tum karta tiklanabilsin
 * diye (bkz. kullanici bildirimi, 2026-08-17: "üstüne tıklandığında seçilip
 * paramtre değiştirilebilsin").
 */
function focusTileField(e) {
  if (e.target.closest("input, select, textarea")) return;
  e.currentTarget.querySelector("input, select, textarea")?.focus();
}

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
      <div className="premium-tile-grid premium-tile-grid-compact" style={{ marginTop: 10 }}>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">Ekip adı</div>
          <input value={j.team} onChange={(e) => j.setTeam(e.target.value)} placeholder="örn: RPA Ekibi" />
        </div>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">
            Sprint No <span className="opt">opsiyonel</span>
          </div>
          <input value={j.sprintNo} onChange={(e) => j.setSprintNo(e.target.value)} placeholder="örn: 7" />
        </div>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">Dönem başlangıcı</div>
          <input type="date" value={j.period.periodStart} onChange={(e) => j.setPeriod((p) => ({ ...p, periodStart: e.target.value }))} />
        </div>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">Dönem bitişi</div>
          <input type="date" value={j.period.periodEnd} onChange={(e) => j.setPeriod((p) => ({ ...p, periodEnd: e.target.value }))} />
        </div>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">Rapor tarihi</div>
          <input type="date" value={j.period.reportDate} onChange={(e) => j.setPeriod((p) => ({ ...p, reportDate: e.target.value }))} />
        </div>
        <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
          <div className="premium-tile-label">
            Önceki rapor tarihi <span className="opt">opsiyonel · Kapanan/Eklenen için</span>
          </div>
          <input type="date" value={j.previousSnapshotDate} onChange={(e) => j.setPreviousSnapshotDate(e.target.value)} />
        </div>
      </div>
      <div className="mhint">
        Önceki rapor tarihini girersen <b>Dönem Kapanan / Yeni Eklenen / Net Değişim</b> otomatik hesaplanır (iş
        kalemlerindeki eklenme/kapanma tarihlerine göre) — elle girmen gerekmez. Boş bırakırsan bu kart görünmez.
        Kapanan iş yükünü veya <b>Canlıya Alınan FTE</b>'yi (Jira'da bu bilgi yok) elle değiştirmek istersen, Canlı
        Önizleme'deki <b>Düzenle</b> ekranından yapabilirsin.
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
