import { IconTag } from "../shared/icons";
import { DEFAULT_DASHBOARD_TABLE_HEADERS } from "../../lib/dashboardTableHeaders";

/**
 * "Kişi Bazlı Kapasite Özeti" tablosunun kolon basliklarini (Kişi/Toplam İş
 * Yükü/Tamamlanan/Açık İş Yükü/Kullanılabilir Kapasite/Bakımlı Doluluk %/
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
        <div className="deltagrid">
          <div className="field">
            <label><IconTag className="field-icon" />Kişi</label>
            <input value={th.kisi} onChange={set("kisi")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.kisi} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Toplam iş yükü</label>
            <input value={th.toplam} onChange={set("toplam")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.toplam} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Tamamlanan</label>
            <input value={th.tamamlanan} onChange={set("tamamlanan")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.tamamlanan} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Açık iş yükü</label>
            <input value={th.acik} onChange={set("acik")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.acik} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Kullanılabilir kapasite</label>
            <input value={th.kapasite} onChange={set("kapasite")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.kapasite} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Bakımlı doluluk</label>
            <input value={th.doluluk} onChange={set("doluluk")} placeholder={DEFAULT_DASHBOARD_TABLE_HEADERS.doluluk} />
          </div>
          <div className="field">
            <label><IconTag className="field-icon" />Durum</label>
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
