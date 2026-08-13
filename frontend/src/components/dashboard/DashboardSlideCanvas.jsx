import { CARD_TONES, DAV_COLORS, barColor, buildSummaryCards, dStatus, nfmtInt, npct, personTotals } from "../../lib/format";
import { resolveTableHeaders } from "../../lib/dashboardTableHeaders";
import { DEFAULT_CORNER_MESH } from "../../assets/cornerMesh";

const S = 96; // px per inch - dashboardDeckBuilder.js ile AYNI inc koordinatlari
const CORNER_MESH_RATIO = 658 / 960;

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

  const th = resolveTableHeaders(dd.tableHeaders);
  const cards = buildSummaryCards(dd);
  const totals = personTotals(dd.persons);
  const d = dd.delta;
  const noteParts = d
    ? [d.kapanan !== "" && d.kapanan != null ? `Dönem Kapanan: ${nfmtInt(d.kapanan)} A/G` : null, d.fte !== "" && d.fte != null ? `Canlıya Alınan FTE: ${String(d.fte).trim()}` : null].filter(Boolean)
    : [];

  // PPTX'teki (dashboardDeckBuilder.js) ile AYNI inc koordinatlari - sol kenar
  // boşluğunda (x=0..0.4 HER ZAMAN bos, KPI kartlari da "Kişi" kolonu da
  // x=0.4'te baslar). Eskiden sag-altta "Durum" kolonunun ustune biniyordu
  // (bkz. kullanici bildirimi: "kapasite sayfasında ise çok yanlış bir yerde").
  const cmW = 1.9, cmH = cmW / CORNER_MESH_RATIO;
  // eskiden neredeyse tamami slayt disina taşiyordu (bkz. kullanici
  // bildirimi: "hala sayfa dışında kalıyor") - saga kaydirildi.
  const cmX = -cmW * 0.42, cmY = 7.5 - cmH + 0.15;

  return (
    <div className="slidecanvas tab-dashboard" style={{ transform: `scale(${scale})` }}>
      <div className="dash">
        {/* .dash kendi (opak PANEL rengi) arka planini tasidigi icin sablon
            gorseli BUNUN UZERINDE (ilk cocuk), ama kpi kartlari/tablo gibi
            geri kalan icerigin ALTINDA olmali - bkz. pptx katman sirasi
            (dashboardDeckBuilder.js: panel bg -> daireler -> mesh -> icerik). */}
        <img
          className="corner-mesh-deco"
          src={DEFAULT_CORNER_MESH}
          alt=""
          aria-hidden="true"
          style={{ position: "absolute", left: cmX * S, top: cmY * S, width: cmW * S, height: cmH * S, opacity: 0.55, pointerEvents: "none", filter: "blur(1.5px)", transform: "scaleX(-1)" }}
        />
        {/* .dkpis/.dcard/.dtable normal akista (position verilmemis) -
            konumlandirilmis elemanlar DOM sirasindan bagimsiz olarak HER
            ZAMAN statik akis icerigin USTUNDE boyanir; bu wrapper'a
            position:relative vermek onu mesh img ile AYNI seviyeye getirip
            DOM sirasina (mesh -> wrapper) gore dogru sekilde USTTE
            boyanmasini saglar - aksi halde mesh, kartlarin/tablonun
            USTUNE cikardi. */}
        <div style={{ position: "relative" }}>
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
        <div className="dsec">Ekip Özet</div>
        <div className="dkpis">
          {cards.map((c, i) => {
            const tone = c.toneName ? CARD_TONES[c.toneName] : null;
            return (
              <div
                className="dcard"
                key={i}
                data-tone={c.toneName || undefined}
                style={{ "--tone-bg": tone ? "#" + tone.bg : undefined, "--tone-border": tone ? "#" + tone.border : undefined }}
              >
                <div className="cl">{c.label}</div>
                <div className="cv" style={{ color: tone ? "#" + tone.fg : "var(--ink)", fontSize: c.text ? 18 : 27 }}>{c.value}</div>
                <div className="cu">{c.sub}</div>
              </div>
            );
          })}
        </div>
        {noteParts.length > 0 && (
          <div className="dnote">
            {noteParts.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        )}
        <div className="dhead">Kişi Bazlı Kapasite Özeti</div>
        <div className="dtable">
          <div className="dtr h">
            <span>{th.kisi}</span>
            <span className="ctr">{th.tamamlanan}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.acik}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.kapasite}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.toplam}<b className="ag">(AG)</b></span>
            <span>{th.doluluk}</span>
            <span className="ctr">{th.durum}</span>
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
                <div className="c">{nfmtInt(p.tamamlanan)}</div>
                <div className="c b">{nfmtInt(p.acik)}</div>
                <div className="c">{nfmtInt(p.kapasite)}</div>
                <div className="c">{nfmtInt(p.toplam)}</div>
                <div className="dol">
                  <div className="dbar"><i style={{ width: fill + "%", background: "#" + barColor(p.doluluk), "--fill-accent": "#" + barColor(p.doluluk) }} /></div>
                  <div className="pc" title={p.bakimOrani != null ? `Kişiye özel bakım oranı: %${Math.round(p.bakimOrani * 100)}` : "Takım geneli bakım oranı kullanılıyor"}>
                    {npct(p.doluluk)}
                    {p.bakimOrani != null && <span style={{ fontSize: 9, color: "var(--mut)", marginLeft: 4 }}>(bakım %{Math.round(p.bakimOrani * 100)})</span>}
                  </div>
                </div>
                <div className="pill" style={{ color: "#" + ps.fg, background: "#" + ps.bg, borderColor: "#" + ps.fg, "--pill-accent": "#" + ps.fg }}>
                  {ps.label}
                </div>
              </div>
            );
          })}
          {(dd.persons || []).length > 0 && (
            <div className="dtr total">
              <div className="tlabel">EKİP TOPLAMI</div>
              <div className="c">{nfmtInt(totals.tamamlanan)}</div>
              <div className="c">{nfmtInt(totals.acik)}</div>
              <div className="c">{nfmtInt(totals.kapasite)}</div>
              <div className="c">{nfmtInt(totals.toplam)}</div>
              <div />
              <div />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
