import { useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { IconSun, IconMoon, IconDownload, IconUpload } from "./icons";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * PPTX indirmeden ONCE gosterilen onizleme popup'u. Kullanici burada slaytlari
 * (kapak/icerik/dashboard) buyuk halde gozden gecirebilir VE acik/koyu tema
 * arasinda gecis yaparak PPTX ciktisinin rengini secebilir - bu artik TEK
 * tema secim noktasidir (eskiden navbar'da ayrica bir Açık/Koyu anahtari da
 * vardi, kullaniciyi karistirdigi ve ustelik BU popup'un kendi toggle'ini
 * hicbir sekilde etkilemedigi icin kaldirildi). previewTheme, App.jsx'teki
 * "pptxTheme" state'i uzerinden CONTROLLED gelir - hem buradaki mockup'i hem
 * de "İndir"e basildiginda gercekten uretilen dosyanin rengini (bkz.
 * handleGenerateFullDeck/buildFullDeck) belirler. Sayfanin geri kalaninin
 * (uygulama genelindeki tema/useTheme) BUNDAN etkilenmemesi icin
 * .zoomstagewrap'a global ".theme-dark" YERINE kendine ozel ".preview-dark"/
 * ".preview-light" sinifi eklenir (bkz. theme.css) - onceki surumde burada
 * da ".theme-dark" kullanilmisti, bu da sayfa genelinde koyu tema acikken
 * (html.theme-dark) yerel "acik" secimini ETKISIZ birakiyordu (ata zincirinden
 * gelen ayni class zaten eslesiyordu) - kullanici bildirimi: "üstüne basıldığı
 * zaman göstermiyor" - bunun kok nedeni buydu.
 */
export default function ExportPreviewModal({ open, onClose, tabs, activeTab, onTabChange, renderCanvas, previewTheme, onPreviewThemeChange, onConfirmDownload, downloading }) {
  const { boxRef, scale } = useCanvasFit({ fitParent: true, active: open });
  const idx = tabs ? Math.max(0, tabs.findIndex((t) => t.key === activeTab)) : 0;
  const goTo = (delta) => tabs && onTabChange(tabs[(idx + delta + tabs.length) % tabs.length].key);

  // "Kendi şablonunuzu ekleyin" - bkz. kullanici bildirimi ("her pptx indirme
  // buttonlarından bahsediyorum"). Yuklenen gorsel SADECE bu indirme icin
  // bellekte tutulur, hicbir yere kaydedilmez - onConfirmDownload'a parametre
  // olarak gecirilir (bkz. App.jsx handleGenerateFullDeck).
  const [customTemplate, setCustomTemplate] = useState(null);
  const [customTemplateName, setCustomTemplateName] = useState("");
  const fileInputRef = useRef(null);
  const handleTemplateFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setCustomTemplateName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCustomTemplate(e.target.result);
    reader.readAsDataURL(file);
  };

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
          onClick={() => onPreviewThemeChange(previewTheme === "dark" ? "light" : "dark")}
          title={previewTheme === "dark" ? "PPTX çıktısını açık temada göster" : "PPTX çıktısını koyu temada göster"}
          aria-label="PPTX çıktısının temasını değiştir"
          style={{ marginLeft: "auto" }}
        >
          {previewTheme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <Button variant="close" className="zoom-close" onClick={onClose}>
          Vazgeç
        </Button>
      </div>
      <div className={`zoomstagewrap ${previewTheme === "dark" ? "preview-dark" : "preview-light"}`}>
        <div className="zoomstage" ref={boxRef}>
          {open && renderCanvas(scale)}
        </div>
      </div>
      <div className="export-preview-footer">
        <span className="mhint">
          Sunum <b>varsayılan şablonda</b> indirilecektir — isterseniz kendi şablon görselinizi
          ekleyebilirsiniz (kaydedilmez, sadece bu indirme için kullanılır). Seçtiğiniz tema indirilecek PPTX'e yansır.
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleTemplateFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
        <Button variant="soft" onClick={() => fileInputRef.current?.click()}>
          <IconUpload style={{ width: 15, height: 15 }} />
          {customTemplateName || "Kendi şablonunuzu ekleyin"}
        </Button>
        <Button variant="primary" loading={downloading} loadingLabel="Hazırlanıyor…" onClick={() => onConfirmDownload(customTemplate || undefined)}>
          <IconDownload className="navbar-icon" />
          PPTX İndir
        </Button>
      </div>
    </Modal>
  );
}
