// Excel "İş_Listesi" sayfasindaki gercek Statü degerleriyle (bkz. lib/excelParsers.js
// RPA_STATUS_MAP) ve StatusEditor'un kendi hint metnindeki ornekle (Canlı, İptal)
// birebir ayni katalog - kullanici artik statu kodu/etiketini elle yazmak yerine
// bu listeden secebilir. Listede olmayan bir durum icin "Özel" secilip elle
// yazilabilir (asagida CUSTOM_VALUE).
export const STATUS_PRESETS = [
  { code: "OPEN", label: "Açık" },
  { code: "DONE", label: "Tamamlandı" },
  { code: "CANLI", label: "Canlı" },
  { code: "CANLIDA_Y", label: "Canlıda/Y" },
  { code: "UAT", label: "UAT" },
  { code: "GELISTIRME", label: "Geliştirme" },
  { code: "ANALIZ", label: "Analiz" },
  { code: "DEVAM_EDIYOR", label: "Devam Ediyor" },
  { code: "ANALIZ_ONAYI", label: "Analiz Onayı" },
  { code: "ON_ANALIZ", label: "Ön Analiz" },
  { code: "BACKLOG", label: "Backlog" },
  { code: "BEKLEMEDE", label: "Beklemede" },
  { code: "MUSTERI_BEKLENIYOR", label: "Müşteri Bekleniyor" },
  { code: "ANALIZ_HAVUZU", label: "Analiz Havuzu" },
  { code: "GELISTIRME_HAVUZU", label: "Geliştirme Havuzu" },
  { code: "IPTAL", label: "İptal" },
];

const CUSTOM_VALUE = "__custom__";

/**
 * Is kalemi statu listesini duzenler. "Tamamlandi sayilir" isaretli statuler
 * backend'de Toplam Planlanan Efor'dan dusulup Kalan Efor'u azaltir.
 * Pressman - User Help Facilities: her sutunun ne ise yaradigi acikca etiketlenir.
 */
export default function StatusEditor({ statuses, onAdd, onUpdate, onRemove }) {
  return (
    <div className="bandpanel">
      <div className="bandtoggle" style={{ cursor: "default" }}>Statü listesi</div>
      <div className="bandsub">
        "Tamamlandı sayılır" işaretli statüdeki iş kalemlerinin eforu Kalan Efor'dan düşer (örn. Canlı, İptal).
      </div>
      {statuses.map((s, i) => {
        const preset = STATUS_PRESETS.find((p) => p.code === s.code);
        const selectValue = preset ? preset.code : CUSTOM_VALUE;
        return (
          <div className="bar" key={i}>
            <div className="barrow">
              <select
                className="premium-select premium-select-sm"
                style={{ flex: "0 0 190px" }}
                value={selectValue}
                onChange={(e) => {
                  if (e.target.value === CUSTOM_VALUE) {
                    onUpdate(i, { code: "", label: "" });
                    return;
                  }
                  const p = STATUS_PRESETS.find((x) => x.code === e.target.value);
                  onUpdate(i, { code: p.code, label: p.label });
                }}
              >
                {STATUS_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
                <option value={CUSTOM_VALUE}>Özel (elle yaz)…</option>
              </select>
              {selectValue === CUSTOM_VALUE && (
                <>
                  <input
                    className="barlabel"
                    style={{ flex: "0 0 120px" }}
                    placeholder="Kod (örn: DONE)"
                    value={s.code}
                    onChange={(e) => onUpdate(i, { code: e.target.value })}
                  />
                  <input
                    className="barlabel"
                    placeholder="Etiket (örn: Tamamlandı)"
                    value={s.label}
                    onChange={(e) => onUpdate(i, { label: e.target.value })}
                  />
                </>
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={s.countsAsCompleted} onChange={(e) => onUpdate(i, { countsAsCompleted: e.target.checked })} />
                Tamamlandı sayılır
              </label>
              <button type="button" className="delbar" onClick={() => onRemove(i)}>
                Sil
              </button>
            </div>
          </div>
        );
      })}
      <button type="button" className="addbar" onClick={onAdd}>
        + Statü ekle
      </button>
    </div>
  );
}
