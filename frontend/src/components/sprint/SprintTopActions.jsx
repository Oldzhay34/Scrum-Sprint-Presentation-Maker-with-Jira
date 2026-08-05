import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload, IconDownload, IconSave } from "../shared/icons";

/**
 * Sprint modu ust bar eylemleri. Pressman - Command/Menu Labeling: tum
 * etiketler eylem bildiren fiil yapisinda ("Excel Yükle", "PPTX İndir").
 * "Kaydet" (onSave), duzenleme yetkisi olmayan kullanicilar icin gizlenir
 * (App.jsx'te canEdit false ise onSave={null} geciliyor).
 */
export default function SprintTopActions({
  onExcelFile, excelLoading, onGenerate, generating, onSave, saving, pptxTheme, onPptxThemeChange,
}) {
  const fileInputRef = useRef(null);

  return (
    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {onPptxThemeChange && (
        <span className="pptx-theme-switch" title="PPTX çıktısının teması">
          <button type="button" className={pptxTheme !== "dark" ? "active" : ""} onClick={() => onPptxThemeChange("light")}>
            Açık
          </button>
          <button type="button" className={pptxTheme === "dark" ? "active" : ""} onClick={() => onPptxThemeChange("dark")}>
            Koyu
          </button>
        </span>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) onExcelFile(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <Button variant="ghost" loading={excelLoading} loadingLabel="Okunuyor…" onClick={() => fileInputRef.current?.click()}>
        <IconUpload className="navbar-icon" />
        Excel Yükle
      </Button>
      {onSave && (
        <Button variant="ghost" loading={saving} loadingLabel="Kaydediliyor…" onClick={onSave}>
          <IconSave className="navbar-icon" />
          Kaydet
        </Button>
      )}
      <Button variant="primary" loading={generating} loadingLabel="Hazırlanıyor…" onClick={onGenerate}>
        <IconDownload className="navbar-icon" />
        PPTX İndir
      </Button>
    </span>
  );
}
