import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload } from "../shared/icons";
import { sanitizeIntegerInput } from "../../lib/format";

/**
 * Sihirbazin 1. adimi: Kapak sayfasi parametreleri (ekip adi / sprint no /
 * tarih araligi - eskiden sabit ust cubuk olan MetaBar) + kapak gorseli.
 * Gorsel varsayilan olarak ASSETS.cover_bg gelir, kullanici degistirebilir
 * (bkz. useCoverImage).
 */
export default function CoverPage({ team, setTeam, sprint, setSprint, range, setRange, cover }) {
  const fileInputRef = useRef(null);

  return (
    <section>
      <div className="meta" style={{ borderRadius: 12, border: "1px solid var(--line)" }}>
        <div className="field grow">
          <label>Ekip adı</label>
          <input value={team} onChange={(e) => setTeam(e.target.value)} />
        </div>
        <div className="field">
          <label>Sprint no</label>
          <input inputMode="numeric" value={sprint} onChange={(e) => setSprint(sanitizeIntegerInput(e.target.value))} />
        </div>
        <div className="field grow">
          <label>Tarih aralığı</label>
          <input value={range} onChange={(e) => setRange(e.target.value)} />
        </div>
      </div>

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
