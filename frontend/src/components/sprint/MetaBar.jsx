export default function MetaBar({ team, setTeam, sprint, setSprint, range, setRange, excelInfo }) {
  return (
    <div className="meta">
      <div className="field grow">
        <label>Ekip adı</label>
        <input value={team} onChange={(e) => setTeam(e.target.value)} />
      </div>
      <div className="field">
        <label>Sprint no</label>
        <input value={sprint} onChange={(e) => setSprint(e.target.value)} />
      </div>
      <div className="field grow">
        <label>Tarih aralığı</label>
        <input value={range} onChange={(e) => setRange(e.target.value)} />
      </div>
      <div className="excelinfo">{excelInfo}</div>
    </div>
  );
}
