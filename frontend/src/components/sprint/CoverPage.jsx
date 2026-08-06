import { useRef, useState } from "react";
import Button from "../shared/Button";
import AlertModal from "../shared/AlertModal";
import ReadOnlyNotice from "../shared/ReadOnlyNotice";
import { IconUpload } from "../shared/icons";
import { isValidNumberInput } from "../../lib/validation";
import { sanitizeIntegerInput } from "../../lib/format";
import { TEAM_TYPES } from "../../lib/teamTypes";

/**
 * Sihirbazin 1. adimi: Kapak sayfasi parametreleri (takim tipi / sprint no /
 * tarih araligi - eskiden sabit ust cubuk olan MetaBar) + kapak gorseli.
 * Gorsel varsayilan olarak ASSETS.cover_bg gelir, kullanici degistirebilir
 * (bkz. useCoverImage).
 *
 * Ekip adi ayrica elle girilmiyor - goruntulenen isim secilen Takım Tipi'nin
 * etiketinden otomatik turer (bkz. useSprintForm.js). Boylece iki farkli
 * yerde (secim + serbest metin) ayni bilgiyi tutup birbirinden sapan iki
 * "ekip adi" gorunmesi engellenir; Excel yuklendiginde de sadece takim tipi
 * degisir, isim otomatik onu takip eder.
 *
 * Takım Tipi secimi, kullanicinin kendi takimina ait olmayan bir sunumu da
 * (salt-okunur) goruntuleyebilmesi icin HER ZAMAN etkilesimli kalir; canEdit
 * false ise (bkz. App.jsx/currentUser) geri kalan parametre alanlari yerine
 * ReadOnlyNotice gosterilir.
 */
export default function CoverPage({ teamType, setTeamType, sprint, setSprint, range, setRange, cover, canEdit = true }) {
  const fileInputRef = useRef(null);
  const [sprintAlert, setSprintAlert] = useState(false);

  const handleSprintBlur = () => {
    if (!isValidNumberInput(sprint)) setSprintAlert(true);
  };

  return (
    <section>
      <div className="meta" style={{ borderRadius: 12, border: "1px solid var(--line)" }}>
        <div className="field grow">
          <label>Takım tipi</label>
          <select className="premium-select" value={teamType} onChange={(e) => setTeamType(e.target.value)}>
            {TEAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {canEdit && (
          <>
            <div className="field">
              <label>Sprint no</label>
              <input inputMode="numeric" value={sprint} onChange={(e) => setSprint(sanitizeIntegerInput(e.target.value))} onBlur={handleSprintBlur} />
            </div>
            <div className="field grow">
              <label>Tarih aralığı</label>
              <input value={range} onChange={(e) => setRange(e.target.value)} />
            </div>
          </>
        )}
      </div>

      {!canEdit && <ReadOnlyNotice teamType={teamType} />}

      <AlertModal
        open={sprintAlert}
        title="Eksik bilgi"
        message="Sprint no sayı olmalı (örn: 7)."
        onClose={() => setSprintAlert(false)}
      />

      {canEdit && (
        <>
          <p className="panelttl" style={{ marginTop: 14 }}>Kapak görseli</p>
          <div className="sec">
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <img
                src={cover.coverBg}
                alt="Kapak görseli önizleme"
                style={{ width: 160, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) cover.setFromFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                <span style={{ display: "flex", gap: 10 }}>
                  <Button variant="soft" loading={cover.uploading} loadingLabel="Yükleniyor…" onClick={() => fileInputRef.current?.click()}>
                    <IconUpload className="navbar-icon" />
                    Görseli Değiştir
                  </Button>
                  {cover.isCustom && (
                    <Button variant="ghost" onClick={cover.reset}>
                      Varsayılana Dön
                    </Button>
                  )}
                </span>
                {cover.uploadError && <div className="hint" style={{ color: "#B45309" }}>{cover.uploadError}</div>}
              </div>
            </div>
            <div className="hint" style={{ marginTop: 10 }}>
              Değiştirmezseniz varsayılan kapak görseli kullanılır. Seçtiğiniz görsel bu oturuma özeldir.
            </div>
          </div>
        </>
      )}
    </section>
  );
}
