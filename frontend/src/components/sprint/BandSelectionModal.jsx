import { useState } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";
import { MAX_BAND_BARS } from "../../hooks/useBandEditor";

/**
 * Excel/Jira kaynagindan MAX_BAND_BARS'tan fazla hedef barı geldiginde
 * gosterilir - kullanicidan tam olarak MAX_BAND_BARS tanesini secmesini
 * ister. Pressman - Error Information Handling: sinir net soylenir, tek ve
 * acik bir eylemle (Onayla) devam edilir.
 */
export default function BandSelectionModal({ candidates, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(() => new Set());

  if (!candidates) return null;

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else if (next.size < MAX_BAND_BARS) next.add(i);
      return next;
    });
  };

  const canConfirm = selected.size === MAX_BAND_BARS;

  return (
    <Modal open onClose={onCancel} boxClassName="box">
      <div className="mhead">
        <span className="mt">Hedef barı seçimi</span>
        <span className="mtools">
          <Button variant="close" onClick={onCancel}>
            Kapat
          </Button>
        </span>
      </div>
      <div className="mbody" style={{ padding: "16px 20px" }}>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ink)" }}>
          Hedef barı sayısı <b>{MAX_BAND_BARS}</b> ile sınırlanmıştır. Kaynaktan <b>{candidates.length}</b> bar geldi —
          lütfen slaytta gösterilecek <b>{MAX_BAND_BARS}</b> taneyi seçin.
        </p>
        {candidates.map((bar, i) => (
          <label
            key={i}
            className="bar"
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px" }}
          >
            <input
              type="checkbox"
              checked={selected.has(i)}
              disabled={!selected.has(i) && selected.size >= MAX_BAND_BARS}
              onChange={() => toggle(i)}
            />
            <span style={{ fontWeight: 600 }}>{bar.label || `Bar ${i + 1}`}</span>
            <span className="mhint" style={{ marginLeft: "auto" }}>
              {(bar.segments || []).map((s) => s.value).filter(Boolean).join(" / ")}
            </span>
          </label>
        ))}
        <div className="mhint" style={{ marginTop: 6 }}>
          {selected.size}/{MAX_BAND_BARS} seçildi
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="soft" onClick={onCancel}>
            Vazgeç
          </Button>
          <Button
            variant="primary"
            disabled={!canConfirm}
            onClick={() => onConfirm(candidates.filter((_, i) => selected.has(i)))}
          >
            Onayla
          </Button>
        </div>
      </div>
    </Modal>
  );
}
