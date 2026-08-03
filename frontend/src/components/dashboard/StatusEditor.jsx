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
      {statuses.map((s, i) => (
        <div className="bar" key={i}>
          <div className="barrow">
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
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={s.countsAsCompleted} onChange={(e) => onUpdate(i, { countsAsCompleted: e.target.checked })} />
              Tamamlandı sayılır
            </label>
            <button type="button" className="delbar" onClick={() => onRemove(i)}>
              Sil
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="addbar" onClick={onAdd}>
        + Statü ekle
      </button>
    </div>
  );
}
