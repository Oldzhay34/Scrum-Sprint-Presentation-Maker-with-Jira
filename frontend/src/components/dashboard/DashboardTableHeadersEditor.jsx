import { IconTag } from "../shared/icons";
import { DEFAULT_DASHBOARD_TABLE_HEADERS } from "../../lib/dashboardTableHeaders";

/** Kartin bos noktasina tiklaninca da kendi input'unu odaklar - bkz. JiraDashboardPanel.jsx'teki ayni yardimci. */
function focusTileField(e) {
  if (e.target.closest("input, select, textarea")) return;
  e.currentTarget.querySelector("input, select, textarea")?.focus();
}

/**
 * "Kişi Bazlı Kapasite Özeti" tablosunun kolon basliklarini (Kişi/Toplam İş
 * Yükü/Tamamlanan/Açık İş Yükü/Kapasite/Kapasite %/
 * Durum) elle degistirmeye yarar - bkz. kullanici bildirimi. Hem canli
 * onizlemeyi (DashboardSlideCanvas) hem PPTX ciktisini (dashboardDeckBuilder)
 * ayni anda gunceller (App.jsx activeDashData icine tableHeaders olarak
 * gecirilir). Excel VE Manuel akisinda ORTAK - DashboardPage'de kaynak
 * sekmesinden bagimsiz tek yerde gosterilir.
 */
export default function DashboardTableHeadersEditor({ tableHeaders, setTableHeaders }) {
  const th = { ...DEFAULT_DASHBOARD_TABLE_HEADERS, ...(tableHeaders || {}) };
  const set = (key) => (e) => setTableHeaders({ ...th, [key]: e.target.value });

  return (
    <>
      <p className="panelttl">Kişi tablosu başlıkları</p>
      <div className="bandpanel">
        <div className="premium-tile-grid premium-tile-grid-compact">
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Kişi</div>
            <input value={th.kisi} onChange={set("kisi")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.kisi} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Toplam iş yükü</div>
            <input value={th.toplam} onChange={set("toplam")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.toplam} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Tamamlanan</div>
            <input value={th.tamamlanan} onChange={set("tamamlanan")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.tamamlanan} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Açık iş yükü</div>
            <input value={th.acik} onChange={set("acik")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.acik} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Kapasite</div>
            <input value={th.kapasite} onChange={set("kapasite")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.kapasite} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Kapasite %</div>
            <input value={th.doluluk} onChange={set("doluluk")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.doluluk} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label"><IconTag className="field-icon" />Durum</div>
            <input value={th.durum} onChange={set("durum")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.durum} />
          </div>
        </div>
        <div className="mhint">
          "Kişi Bazlı Kapasite Özeti" tablosunun kolon başlıkları — boş bırakılırsa varsayılan etiket kullanılır.
        </div>
      </div>
    </>
  );
}
