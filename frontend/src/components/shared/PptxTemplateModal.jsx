import { useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { IconDownload, IconUpload } from "./icons";

/**
 * PPTX indirmeden ONCE gosterilen sablon secim popup'u - "PPTX İndir" hangi
 * ekrandan (admin paneli, PO paneli, Ortak Sunum, takim toplu indirme)
 * tetiklenirse tetiklensin AYNI bilesen kullanilir (bkz. kullanici bildirimi:
 * "her pptx indirme buttonlarından bahsediyorum: admin panel po panel ortak
 * sunum takım sunum"). Kullanici isterse kendi sablon gorselini yukler - bu
 * SADECE bu tek indirme icin tarayici bellegin de tutulur, hicbir yere
 * (backend/MinIO/DB) KAYDEDILMEZ (bkz. kullanici bildirimi: "Bu şablonların
 * kaydını tutmayız") - onConfirm'e gecirilen data URI, cagiran tarafta
 * dogrudan pptx uretim fonksiyonuna (cornerMesh parametresi) verilir.
 */
export default function PptxTemplateModal({ open, onClose, onConfirm, downloading }) {
  const [customImage, setCustomImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    setFileError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFileError("Lütfen bir görsel dosyası (PNG/JPG) seçin.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCustomImage(e.target.result);
    reader.onerror = () => setFileError("Dosya okunamadı.");
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setCustomImage(null);
    setFileName("");
    setFileError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    const image = customImage;
    reset();
    onConfirm(image);
  };

  return (
    <Modal open={open} onClose={handleClose} boxClassName="box pptx-template-box">
      <div className="pptx-template-head">
        <span className="pptx-template-icon">
          <IconDownload style={{ width: 20, height: 20 }} />
        </span>
        <h3 className="pptx-template-title">PPTX Şablonu</h3>
      </div>
      <p className="pptx-template-desc">
        Sunum <b>varsayılan şablonda</b> indirilecektir. İsterseniz kendi şablon görselinizi
        ekleyebilirsiniz — bu görsel kaydedilmez, sadece bu indirme için kullanılır.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <Button variant="soft" className="pptx-template-upload" onClick={() => fileInputRef.current?.click()}>
        <IconUpload style={{ width: 15, height: 15 }} />
        {fileName || "Kendi şablon görselinizi ekleyin (opsiyonel)"}
      </Button>
      {fileError && <div className="login-error" style={{ margin: "8px 0" }}>{fileError}</div>}
      {customImage && (
        <div className="pptx-template-preview">
          <img src={customImage} alt="" style={{ maxWidth: 140, maxHeight: 100, borderRadius: 8, border: "1px solid var(--line)" }} />
        </div>
      )}
      <div className="pptx-template-actions">
        <Button variant="ghost" onClick={handleClose}>Vazgeç</Button>
        <Button variant="primary" loading={downloading} loadingLabel="Hazırlanıyor…" onClick={handleConfirm}>
          <IconDownload className="navbar-icon" />
          {customImage ? "Bu Şablonla İndir" : "Varsayılan Şablonla İndir"}
        </Button>
      </div>
    </Modal>
  );
}
