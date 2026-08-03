import { Fragment } from "react";
import { G, BAND, SEGCOL, bandBars, cardsTopFor, pickFS, rowHeights, parseRuns, num, sectionDefs } from "../../lib/geometry";

const S = 96; // px per inch - orijinal ile birebir ayni olcek

function BulletText({ text }) {
  return (
    <>
      {parseRuns(text).map((run, i) =>
        run.bold ? <b key={i}>{run.text}</b> : <Fragment key={i}>{run.text}</Fragment>
      )}
    </>
  );
}

function Card({ x, y, w, h, items, sec, fontSize }) {
  return (
    <div className="card" style={{ left: x * S, top: y * S, width: w * S, height: h * S }}>
      <div className="acc" style={{ background: "#" + sec.accent }} />
      <div className="chd">
        <img src={sec.icon} alt="" />
        <span className="ct" style={{ color: "#" + sec.accent }}>{sec.title}</span>
      </div>
      <ul style={{ fontSize: fontSize * 1.333 }}>
        {items.map((t, i) => (
          <li key={i}>
            <BulletText text={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Band({ bars }) {
  if (!bars.length) return null;
  const n = bars.length, totalW = BAND.W * S, gap = BAND.GAP * S, barW = (totalW - (n - 1) * gap) / n;
  return (
    <>
      {bars.map((bar, i) => {
        const bx = BAND.X * S + i * (barW + gap);
        const labelW = Math.min(1.2, Math.max(0.55, (barW / S) * 0.32)) * S;
        const segs = bar.segments.filter((s) => s && String(s.value).trim() !== "");
        const sum = segs.reduce((a, s) => a + Math.max(0.0001, num(s.value)), 0) || 1;
        let cx = 0;
        return (
          <div className="pbar" key={i} style={{ left: bx, top: BAND.Y * S, width: barW, height: BAND.H * S }}>
            <div className="plabel" style={{ width: labelW }}>{(bar.label || "").toUpperCase()}</div>
            <div className="psegs">
              {segs.map((s, si) => {
                const w = Math.max(0.14 * S, (num(s.value) / sum) * (barW - labelW - 4));
                const el = (
                  <div key={si} className="pseg" style={{ width: w, background: "#" + (SEGCOL[s.color] || "456BBA") }}>
                    {String(s.value)}
                  </div>
                );
                cx += w;
                return el;
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

/**
 * Sprint slaytini (kapak veya icerik) 1280x720 sabit tuval uzerinde,
 * PPTX ile birebir ayni geometriyle (lib/geometry.js) cizer.
 */
export default function SlideCanvas({ data, tab, assets, scale }) {
  const SEC = sectionDefs(assets);

  let content;
  if (tab === "cover") {
    content = (
      <div className="cov" style={{ backgroundImage: `url(${assets.cover_bg || ""})` }}>
        <div className="wash" />
        <div className="clogos">
          <img className="a" src={assets.logo_a} alt="" />
          <img className="b" src={assets.logo_b} alt="" />
        </div>
        <div className="ctitle">{data.teamName}</div>
        <div className="cline" />
        <div className="csub">{data.subtitle}</div>
      </div>
    );
  } else {
    const bars = bandBars(data);
    const cardsTop = cardsTopFor(data);
    const FS = pickFS(data, cardsTop);
    const { topH, botH } = rowHeights(data, FS);
    const yBot = cardsTop + topH + G.GAP_Y;
    content = (
      <>
        <div className="s-header">{data.subtitle}</div>
        <div className="s-logos">
          <img src={assets.logo_b} alt="" />
          <img src={assets.logo_a} alt="" />
        </div>
        <div className="s-rule" />
        <Band bars={bars} />
        <Card x={G.X_L} y={cardsTop} w={G.COL_W} h={topH} items={data.done} sec={SEC.done} fontSize={FS} />
        <Card x={G.X_L} y={yBot} w={G.COL_W} h={botH} items={data.risk} sec={SEC.risk} fontSize={FS} />
        <Card x={G.X_R} y={cardsTop} w={G.COL_W} h={topH} items={data.active} sec={SEC.active} fontSize={FS} />
        <Card x={G.X_R} y={yBot} w={G.COL_W} h={botH} items={data.pending} sec={SEC.pending} fontSize={FS} />
        <div className="s-footer">Gizli &amp; Dahili Kullanım&nbsp;&nbsp;|&nbsp;&nbsp;Scrum Ekibi – Planlama Toplantısı</div>
      </>
    );
  }

  return (
    <div className="slidecanvas" style={{ transform: `scale(${scale})` }}>
      {content}
    </div>
  );
}
