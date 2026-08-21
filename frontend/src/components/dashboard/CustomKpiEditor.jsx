import { sanitizeDecimalInput } from "../../lib/format";
import { IconPlusCircle } from "../shared/icons";

/**
 * Takima ozgu ek gostergeler (orn. RPA'da "FTE Hedef", "Hedef Süreç Sayısı").
 * Bunlar backend'in genel kapasite formulune girmez, sadece onizlemede/PPTX'te
 * ekstra kart olarak gosterilir - tamamen manuel/istemci tarafi bir parametredir.
 * Pressman - User Help Facilities: neden var oldugu ve nasil calistigi acikca anlatilir.
 */
export default function CustomKpiEditor({ kpis, onAdd, onUpdate, onRemove, hasFte = true }) {
  const example = hasFte ? `"FTE Hedef: 25.7", "Hedef Süreç Sayısı: 87"` : `"Hedef Süreç Sayısı: 48"`;
  return (
    <div className="bandpanel">
      <div className="bandtoggle" style={{ cursor: "default" }}>Ek göstergeler (opsiyonel)</div>
      <div className="bandsub">
        Takıma özgü, otomatik hesaplanmayan hedef/sabit değerler (örn. {example}). Dashboard'da ek kart olarak görünür.
      </div>
      {kpis.map((k, i) => (
        <div className="bar" key={i}>
          <div className="barrow">
            <input
              className="barlabel"
              style={{ flex: "1 1 160px" }}
              placeholder="Etiket (örn: FTE Hedef)"
              value={k.label}
              onChange={(e) => onUpdate(i, { label: e.target.value })}
            />
            <input
              className="barlabel"
              style={{ flex: "0 0 110px" }}
              placeholder="Değer (örn: 25.7)"
              inputMode="decimal"
              value={k.value}
              onChange={(e) => onUpdate(i, { value: sanitizeDecimalInput(e.target.value, true) })}
            />
            <input
              className="barlabel"
              style={{ flex: "0 0 110px" }}
              placeholder="Birim (opsiyonel)"
              value={k.unit}
              onChange={(e) => onUpdate(i, { unit: e.target.value })}
            />
            <button type="button" className="delbar" onClick={() => onRemove(i)}>
              Sil
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="premium-add-btn" onClick={onAdd} style={{ marginTop: 4 }}>
        <IconPlusCircle className="add-btn-icon" />
        Gösterge ekle
      </button>
    </div>
  );
}
