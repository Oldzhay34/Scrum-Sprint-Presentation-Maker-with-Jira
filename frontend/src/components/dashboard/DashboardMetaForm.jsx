import { sanitizeIntegerInput } from "../../lib/format";
import { IconTag, IconHash } from "../shared/icons";

export default function DashboardMetaForm({ dTeam, setDTeam, dSprint, setDSprint }) {
  return (
    <>
      <p className="panelttl">Rapor başlığı</p>
      <div className="bandpanel">
        <div className="deltagrid">
          <div className="field">
            <label><IconTag className="field-icon" />Ekip adı</label>
            <input value={dTeam} onChange={(e) => setDTeam(e.target.value)} placeholder="Excel'den gelir, düzenlenebilir" />
          </div>
          <div className="field">
            <label>
              <IconHash className="field-icon" />Sprint No <span className="opt">opsiyonel</span>
            </label>
            <input inputMode="numeric" value={dSprint} onChange={(e) => setDSprint(sanitizeIntegerInput(e.target.value))} placeholder="örn: 7" />
          </div>
        </div>
        <div className="mhint">
          Ekip adı başlıkta görünür (Excel'den otomatik gelir). Dönem aralığı tüm raporlarda sabittir:{" "}
          <b>01 Haziran – 31 Aralık 2026</b>. Rapor Tarihi Excel'den okunur. Sprint No girerseniz alt satıra "Sprint N" olarak eklenir, boşsa görünmez.
        </div>
      </div>
    </>
  );
}
