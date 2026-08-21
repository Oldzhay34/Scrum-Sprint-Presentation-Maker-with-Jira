import { IconSpreadsheet, IconEdit, IconJira } from "./icons";

/** Kapasite Dashboard veri kaynagi sekmelerinin sirasi/ikonu/etiketi. */
const SOURCE_TABS = [
  { key: "excel", label: "Excel'den Yükle", Icon: IconSpreadsheet },
  { key: "manual", label: "Manuel Gir", Icon: IconEdit },
  { key: "jira", label: "Jira'dan", Icon: IconJira },
];

/**
 * Kapasite Dashboard veri kaynagi secici - kare/kart gorunumlu premium
 * sekmeler (bkz. kullanici bildirimi, 2026-08-17: "güzel kare kartlar
 * kullan daha güzel durur premium olsun"). Canlı Önizleme panelinin
 * ("CANLI ÖNİZLEME" - bkz. UnifiedPreviewPane) ust cubugunda gosterilir;
 * DashboardPage'in SOL taraftaki formunu kontrol etmeye devam eder, sadece
 * gorsel olarak sag panelde yer alir (bkz. kullanici bildirimi: "ilk resimde
 * attıklarımı ikinci resimdeki yere taşı").
 */
export default function SourceTabs({ source, onSourceChange }) {
  return (
    <div className="source-tabs" role="tablist" aria-label="Kapasite Dashboard veri kaynağı">
      {SOURCE_TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={source === key}
          className={`source-tab${source === key ? " active" : ""}`}
          onClick={() => onSourceChange(key)}
        >
          <Icon className="source-tab-icon" />
          <span className="source-tab-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
