export default function DashboardMetaForm({ dTeam, setDTeam, dSprint, setDSprint }) {
  return (
    <>
      <p className="panelttl">Rapor başlığı</p>
      <div className="bandpanel">
        <div className="deltagrid">
          <div className="field">
            <label>Ekip adı</label>
            <input value={dTeam} onChange={(e) => setDTeam(e.target.value)} placeholder="Excel'den gelir, düzenlenebilir" />
          </div>
          <div className="field">
            <label>
              Sprint No <span className="opt">opsiyonel</span>
            </label>
            <input value={dSprint} onChange={(e) => setDSprint(e.target.value)} placeholder="örn: 7" />
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
