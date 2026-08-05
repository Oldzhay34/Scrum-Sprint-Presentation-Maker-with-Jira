import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { IconSun, IconMoon, IconDownload } from "./icons";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * PPTX indirmeden ONCE gosterilen onizleme popup'u. Kullanici burada slaytlari
 * (kapak/icerik/dashboard) buyuk halde gozden gecirebilir VE acik/koyu tema
 * arasinda gecis yaparak onizlemenin iki modda da nasil gorundugunu kontrol
 * edebilir. Bu tema secimi TAMAMEN YEREL/gecicidir - sadece bu popup'taki
 * slayt tuvalini etkiler, sayfanin geri kalanini (uygulama genelindeki
 * tema/useTheme) DEGISTIRMEZ. Gercek PPTX dosyasinin renkleri sabittir (tema
 * sadece EKRANDAKI onizlemeyi etkiler) - "İndir" her zaman ayni ciktiyi
 * uretir. "İndir"e basilana kadar dosya INMEZ - Vazgec/Kapat ile iptal edilebilir.
 */
export default function ExportPreviewModal({ open, onClose, tabs, activeTab, onTabChange, renderCanvas, initialTheme = "light", onConfirmDownload, downloading }) {
  const { boxRef, scale } = useCanvasFit();
  const [previewTheme, setPreviewTheme] = useState(initialTheme);
  const idx = tabs ? Math.max(0, tabs.findIndex((t) => t.key === activeTab)) : 0;
  const goTo = (delta) => tabs && onTabChange(tabs[(idx + delta + tabs.length) % tabs.length].key);

  return (
    <Modal open={open} onClose={onClose} boxClassName="zoombox">
      <div className="zoombar">
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
        <button
          type="button"
          className="theme-toggle export-preview-theme"
          onClick={() => setPreviewTheme((t) => (t === "dark" ? "light" : "dark"))}
          title={previewTheme === "dark" ? "Önizlemeyi açık temada göster" : "Önizlemeyi koyu temada göster"}
          aria-label="Sadece önizlemenin temasını değiştir"
          style={{ marginLeft: "auto" }}
        >
          {previewTheme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <Button variant="close" className="zoom-close" onClick={onClose}>
          Vazgeç
        </Button>
      </div>
      <div className={`zoomstagewrap${previewTheme === "dark" ? " theme-dark" : ""}`}>
        <div className="zoomstage" ref={boxRef}>
          {open && renderCanvas(scale)}
        </div>
      </div>
      <div className="export-preview-footer">
        <span className="mhint">
          Slaytları gözden geçirin — tema seçimi sadece bu önizlemeyi etkiler.{" "}
          İndirmek istediğinize emin olduğunuzda devam edin.
        </span>
        <Button variant="primary" loading={downloading} loadingLabel="Hazırlanıyor…" onClick={onConfirmDownload}>
          <IconDownload className="navbar-icon" />
          PPTX İndir
        </Button>
      </div>
    </Modal>
  );
}
