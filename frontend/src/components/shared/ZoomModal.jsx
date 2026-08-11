import Modal from "./Modal";
import Button from "./Button";
import { useCanvasFit } from "../../hooks/useCanvasFit";
import { useCountdown, formatMmSs } from "../../hooks/useCountdown";
import { useFullscreen } from "../../hooks/useFullscreen";

/**
 * Buyutulmus onizleme modali. Sprint modunda icerik/kapak sekmeleri gosterir,
 * dashboard modunda tek bir tuval gosterir (sekme yok) - orijinal davranisla ayni.
 *
 * `timerSeconds` verilirse (PO'nun Kapak adiminda girdigi sunum suresi),
 * modal acildiginda taze bir geri sayim baslar; son 15 saniyede yanip sonen
 * bir uyari class'i eklenir, 0'a ulasinca sayac orada durur (modal kapanmaz).
 */
export default function ZoomModal({ open, onClose, tabs, activeTab, onTabChange, renderCanvas, timerSeconds = null }) {
  const { boxRef, scale } = useCanvasFit({ fitParent: true, active: open });
  useFullscreen(open);
  const idx = tabs ? Math.max(0, tabs.findIndex((t) => t.key === activeTab)) : 0;
  const goTo = (delta) => tabs && onTabChange(tabs[(idx + delta + tabs.length) % tabs.length].key);
  const remaining = useCountdown(timerSeconds, open);
  const critical = timerSeconds && remaining <= 15;

  return (
    <Modal open={open} onClose={onClose} boxClassName="zoombox">
      <div className="zoombar">
        {timerSeconds != null && (
          <div className={`timer-badge${critical ? " timer-critical" : ""}`}>{formatMmSs(remaining)}</div>
        )}
        {tabs && (
          <div className="carousel-nav">
            <button type="button" className="carousel-arrow" aria-label="Önceki slayt" onClick={() => goTo(-1)}>
              ‹
            </button>
            <div className="carousel-center">
              <span className="carousel-label">{tabs[idx]?.label}</span>
              <div className="carousel-dots">
                {tabs.map((t, i) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`carousel-dot${i === idx ? " active" : ""}`}
                    aria-label={t.label}
                    title={t.label}
                    onClick={() => onTabChange(t.key)}
                  />
                ))}
              </div>
            </div>
            <button type="button" className="carousel-arrow" aria-label="Sonraki slayt" onClick={() => goTo(1)}>
              ›
            </button>
          </div>
        )}
        <Button variant="close" className="zoom-close" onClick={onClose} style={{ marginLeft: "auto" }}>
          Kapat
        </Button>
      </div>
      <div className="zoomstagewrap">
        <div className="zoomstage" ref={boxRef}>
          {open && renderCanvas(scale)}
        </div>
      </div>
    </Modal>
  );
}
