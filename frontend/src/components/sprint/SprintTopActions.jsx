import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload, IconSparkles, IconDownload } from "../shared/icons";

/**
 * Sprint modu ust bar eylemleri. Pressman - Command/Menu Labeling: tum
 * etiketler eylem bildiren fiil yapisinda ("Excel Yükle", "Örnek Doldur", "PPTX İndir").
 */
export default function SprintTopActions({ onExcelFile, excelLoading, onFillSample, onGenerate, generating }) {
  const fileInputRef = useRef(null);

  return (
    <span style={{ display: "flex", gap: 10 }}>
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
      <Button variant="ghost" onClick={onFillSample}>
        <IconSparkles className="navbar-icon" />
        Örnek Doldur
      </Button>
      <Button variant="primary" loading={generating} loadingLabel="Hazırlanıyor…" onClick={onGenerate}>
        <IconDownload className="navbar-icon" />
        PPTX İndir
      </Button>
    </span>
  );
}
