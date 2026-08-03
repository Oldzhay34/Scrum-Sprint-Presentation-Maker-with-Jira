import Modal from "./Modal";
import Button from "./Button";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * Buyutulmus onizleme modali. Sprint modunda icerik/kapak sekmeleri gosterir,
 * dashboard modunda tek bir tuval gosterir (sekme yok) - orijinal davranisla ayni.
 */
export default function ZoomModal({ open, onClose, tabs, activeTab, onTabChange, renderCanvas }) {
  const { boxRef, scale } = useCanvasFit();

  return (
    <Modal open={open} onClose={onClose} boxClassName="zoombox">
      <div className="zoombar">
        {tabs &&
          tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab${activeTab === t.key ? " active" : ""}`}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        <Button variant="close" className="zoom-close" onClick={onClose} style={{ marginLeft: "auto" }}>
          Kapat
        </Button>
      </div>
      <div className="zoomstage" ref={boxRef}>
        {open && renderCanvas(scale)}
      </div>
    </Modal>
  );
}
