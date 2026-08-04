import { useRef, useState } from "react";
import Button from "../shared/Button";
import AlertModal from "../shared/AlertModal";
import { IconUpload } from "../shared/icons";
import { isValidNumberInput } from "../../lib/validation";
import { TEAM_TYPES, teamTypeLabel } from "../../lib/teamTypes";

/**
 * Sihirbazin 1. adimi: Kapak sayfasi parametreleri (ekip adi / takim tipi /
 * sprint no / tarih araligi - eskiden sabit ust cubuk olan MetaBar) + kapak
 * gorseli. Gorsel varsayilan olarak ASSETS.cover_bg gelir, kullanici
 * degistirebilir (bkz. useCoverImage).
 *
 * Takım tipi (RPA / İş Zekası / Diğer) sihirbazin tum adimlarini besler -
 * ornegin FTE'ye ozgu alanlar (Kapasite Dashboard'daki "Canlıya Alınan FTE",
 * Hedefler bandindaki FTE cubugu ipucu) sadece RPA secildiginde gorunur.
 */
export default function CoverPage({ team, setTeam, teamType, setTeamType, sprint, setSprint, range, setRange, cover }) {
  const fileInputRef = useRef(null);
  const [sprintAlert, setSprintAlert] = useState(false);
  // Ekip adi kullanici tarafindan elle degistirilmediyse, takim tipi secimiyle
  // otomatik senkron kalir (secilen tipin varsayilan etiketi yazilir).
  const [teamNameTouched, setTeamNameTouched] = useState(false);

  const handleSprintBlur = () => {
    if (!isValidNumberInput(sprint)) setSprintAlert(true);
  };

  const handleTeamTypeChange = (value) => {
    setTeamType(value);
    if (!teamNameTouched) setTeam(teamTypeLabel(value));
  };

  return (
    <section>
      <div className="meta" style={{ borderRadius: 12, border: "1px solid var(--line)" }}>
        <div className="field">
          <label>Takım tipi</label>
          <select value={teamType} onChange={(e) => handleTeamTypeChange(e.target.value)}>
            {TEAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field grow">
          <label>Ekip adı</label>
          <input
            value={team}
            onChange={(e) => {
              setTeamNameTouched(true);
              setTeam(e.target.value);
            }}
          />
        </div>
        <div className="field">
          <label>Sprint no</label>
          <input value={sprint} onChange={(e) => setSprint(e.target.value)} onBlur={handleSprintBlur} />
        </div>
        <div className="field grow">
          <label>Tarih aralığı</label>
          <input value={range} onChange={(e) => setRange(e.target.value)} />
        </div>
      </div>

      <AlertModal
        open={sprintAlert}
        title="Eksik bilgi"
        message="Sprint no sayı olmalı (örn: 7)."
        onClose={() => setSprintAlert(false)}
      />

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
    </section>
  );
}
