import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload, IconDownload, IconSave } from "../shared/icons";

export default function DashboardTopActions({ onExcelFile, excelLoading, onGenerate, generating, onSave, saving }) {
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
