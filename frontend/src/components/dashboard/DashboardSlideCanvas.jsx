import { DAV_COLORS, barColor, dStatus, nfmt1, nfmtInt, npct } from "../../lib/format";

/**
 * Kapasite dashboard slaydini (KPI kartlari + son 2 hafta delta + kisi tablosu)
 * 1280x720 sabit tuval uzerinde cizer. Orijinal dashSlideHTML ile birebir aynidir.
 */
export default function DashboardSlideCanvas({ dd, assets, scale }) {
  if (!dd.kpis) {
    return (
      <div className="slidecanvas tab-dashboard" style={{ transform: `scale(${scale})` }}>
        <div className="dash">
          <div className="dttl">Kapasite Dashboard</div>
          <div className="dsub" style={{ marginTop: 40 }}>
            Excel yükleyin — Rapor sayfası okunacak.
          </div>
        </div>
      </div>
    );
  }

  const k = dd.kpis, dur = dStatus(k.durum, k.doluluk);
  const cards = [
    ["Toplam İş Yükü", nfmtInt(k.toplam), "A/G", "var(--ink)"],
    ["Tamamlanan İş Yükü", nfmtInt(k.tamamlanan), "A/G", "#16A34A"],
    ["Açık İş Yükü", nfmtInt(k.acik), "A/G", "var(--ink)"],
    ["Kullanılabilir Kapasite", nfmtInt(k.kapasite), "A/G", "#2563EB"],
    ["Bakımlı Doluluk", npct(k.doluluk), "Bakım/SR sonrası %", "#" + dur.bar],
    ["Kapasite Açığı / Fazlası", nfmt1(k.acikFazla), "A/G", k.acikFazla < 0 ? "#DC2626" : "var(--ink)"],
    ["Genel Durum", dur.label, "Doluluk eşiklerine göre", "#" + dur.fg],
    ...(dd.customKpis || []).map((c) => [c.label, c.value, c.unit || "", "#7C3AED"]),
  ];
  const d = dd.delta;
  const deltaCards = d
    ? [
        ["Dönem Kapanan İş Yükü", nfmtInt(d.kapanan)],
        ["Canlıya Alınan FTE", d.fte !== "" ? String(d.fte).trim() : null],
        ["Yeni Eklenen İş Yükü", nfmtInt(d.eklenen)],
        ["Net İş Yükü Değişimi", nfmtInt(d.net), true],
      ].filter((c) => c[1] !== null)
    : [];

  return (
    <div className="slidecanvas tab-dashboard" style={{ transform: `scale(${scale})` }}>
      <div className="dash">
        <div className="dlogos">
          <img src={assets.logo_b} alt="" />
          <img src={assets.logo_a} alt="" />
        </div>
        <div className="dttl">{dd.team} Kapasite Planı</div>
        <div className="dsub">
          {dd.sprintNo ? `Sprint ${dd.sprintNo}  •  ` : ""}
          {dd.dateRange}
          {"  •  Rapor Tarihi: "}
          {dd.reportDate}
        </div>
        <div className="dkpis">
          {cards.map((c, i) => (
            <div className="dcard" key={i}>
              <div className="cl">{c[0]}</div>
              <div className="cv" style={{ color: c[3], fontSize: i === 6 ? 16 : 23 }}>{c[1]}</div>
              <div className="cu">{c[2]}</div>
            </div>
          ))}
        </div>
        {d && (
          <div className="ddelta">
            <div className="dlab">
              <b>Son 2 Hafta</b>
              {d.range && <div>{d.range}</div>}
            </div>
            {deltaCards.map((c, i) => (
              <div className={`dc${c[2] ? " hl" : ""}`} key={i}>
                <div className="l">{c[0]}</div>
                <div className="v">{String(c[1])}</div>
              </div>
            ))}
          </div>
        )}
        <div className="dhead">Kişi Bazlı Kapasite Özeti</div>
        <div className="dtable">
          <div className="dtr h">
            <span>Kişi</span>
            <span className="ctr">Toplam İş Yükü<b className="ag">(AG)</b></span>
            <span className="ctr">Tamamlanan<b className="ag">(AG)</b></span>
            <span className="ctr">Açık İş Yükü<b className="ag">(AG)</b></span>
            <span className="ctr">Kullanılabilir Kapasite<b className="ag">(AG)</b></span>
            <span>Bakımlı Doluluk %</span>
            <span className="ctr">Durum</span>
          </div>
          {(dd.persons || []).map((p, i) => {
            const ps = dStatus(p.durum, p.doluluk);
            const av = "#" + DAV_COLORS[i % DAV_COLORS.length];
            const fill = Math.max(4, Math.min(100, Number(p.doluluk) * 100)).toFixed(1);
            return (
              <div className="dtr" key={i}>
                <div className="kisi">
                  <div className="av" style={{ background: av }}>{(p.initials || p.name.slice(0, 2)).toUpperCase()}</div>
                  <div>
                    <div className="nm">{p.name}</div>
                    {p.role && <div className="rl">{p.role}</div>}
                  </div>
                </div>
                <div className="c">{nfmtInt(p.toplam)}</div>
                <div className="c">{nfmtInt(p.tamamlanan)}</div>
                <div className="c b">{nfmtInt(p.acik)}</div>
                <div className="c">{nfmtInt(p.kapasite)}</div>
                <div className="dol">
                  <div className="dbar"><i style={{ width: fill + "%", background: "#" + barColor(p.doluluk) }} /></div>
                  <div className="pc" title={p.bakimOrani != null ? `Kişiye özel bakım oranı: %${Math.round(p.bakimOrani * 100)}` : "Takım geneli bakım oranı kullanılıyor"}>
                    {npct(p.doluluk)}
                    {p.bakimOrani != null && <span style={{ fontSize: 9, color: "var(--mut)", marginLeft: 4 }}>(bakım %{Math.round(p.bakimOrani * 100)})</span>}
                  </div>
                </div>
                <div className="pill" style={{ color: "#" + ps.fg, background: "#" + ps.bg, borderColor: "#" + ps.fg }}>
                  {ps.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
