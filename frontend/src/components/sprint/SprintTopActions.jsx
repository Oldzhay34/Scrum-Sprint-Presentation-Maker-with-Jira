import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload, IconDownload, IconSave, IconRefresh, IconJira } from "../shared/icons";

/**
 * Sprint modu ust bar eylemleri. Pressman - Command/Menu Labeling: tum
 * etiketler eylem bildiren fiil yapisinda ("Excel Yükle", "PPTX İndir").
 * "Kaydet" (onSave), duzenleme yetkisi olmayan kullanicilar icin gizlenir
 * (App.jsx'te canEdit false ise onSave={null} geciliyor). "Güncelle"
 * (onUpdate) sadece Ortak Sunum ekranindan (?fromJoint=1) gelindiginde
 * gorunur - yeni surum eklemeden mevcut sunumu yerinde gunceller.
 * "Jira'dan Çek" (onJiraSync) DashboardTopActions ile AYNI eylemi tetikler -
 * kullanici sihirbaza girince ILK gordugu adim burasi (Kapak Sayfasi), bu
 * yuzden buton sadece Kapasite Dashboard adiminda degil burada da gorunur
 * olmali (bkz. kullanici bildirimi: "buton gozukmuyor" - sadece 3. adimda
 * oldugu icin bulunamiyordu).
 */
export default function SprintTopActions({
  onExcelFile, excelLoading, onGenerate, generating, onSave, saving, onUpdate, updating,
  onJiraSync, jiraSyncing,
}) {
  const fileInputRef = useRef(null);

  return (
    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
      {onJiraSync && (
        <Button
          variant="ghost"
          loading={jiraSyncing}
          loadingLabel="Jira'dan çekiliyor…"
          onClick={onJiraSync}
          title="Bu takım için Jira senkronizasyonunu tetikler - veriler arka planda birkaç saniye içinde güncellenir"
        >
          <IconJira className="navbar-icon" />
          Jira'dan Çek
        </Button>
      )}
      {onSave && (
        <Button variant="ghost" loading={saving} loadingLabel="Kaydediliyor…" onClick={onSave}>
          <IconSave className="navbar-icon" />
          Kaydet
        </Button>
      )}
      {onUpdate && (
        <Button variant="ghost" loading={updating} loadingLabel="Güncelleniyor…" onClick={onUpdate} title="Ortak Sunum'dan geldiniz - mevcut sürümü yerinde günceller, yeni sürüm eklemez">
          <IconRefresh className="navbar-icon" />
          Güncelle
        </Button>
      )}
      <Button variant="primary" loading={generating} loadingLabel="Hazırlanıyor…" onClick={onGenerate}>
        <IconDownload className="navbar-icon" />
        PPTX İndir
      </Button>
    </span>
  );
}
