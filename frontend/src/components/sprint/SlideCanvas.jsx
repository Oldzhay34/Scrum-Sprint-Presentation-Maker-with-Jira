import { Fragment } from "react";
import {
  G, BAND, SEGCOL, bandBars, cardsTopFor, fitSectionItems, rowHeights, stretchRowHeights, parseRuns, num, sectionDefs,
  extractPriority, PRIORITY_COLORS, PRIORITY_ORDER, PRIORITY_UNSET_LABEL, PRIORITY_UNSET_COLOR, hasPriorityTags,
} from "../../lib/geometry";

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

function PriorityLegend() {
  return (
    <div className="s-legend">
      {PRIORITY_ORDER.map((p) => (
        <span className="s-legend-item" key={p}>
          <i style={{ background: "#" + PRIORITY_COLORS[p] }} />
          {p}
        </span>
      ))}
      <span className="s-legend-item">
        <i style={{ background: "#" + PRIORITY_UNSET_COLOR }} />
        {PRIORITY_UNSET_LABEL}
      </span>
    </div>
  );
}

function Card({ x, y, w, h, items, rawItems, sec, fontSize, editable, onEditText }) {
  return (
    <div className="card" style={{ left: x * S, top: y * S, width: w * S, height: h * S }}>
      <img className="card-watermark" src={sec.icon} alt="" aria-hidden="true" />
      <div className="acc" style={{ background: "#" + sec.accent, boxShadow: "0 0 10px #" + sec.accent + "70" }} />
      <div className="chd">
        <img src={sec.icon} alt="" />
        <span className="ct" style={{ color: "#" + sec.accent }}>{sec.title}</span>
      </div>
      {editable ? (
        <textarea
          className="card-edit"
          style={{ fontSize: fontSize * 1.333 }}
          value={(rawItems || items).join("\n")}
          onChange={(e) => onEditText(e.target.value)}
          placeholder="Her satıra bir madde yazın…"
        />
      ) : (
        <ul style={{ fontSize: fontSize * 1.333 }}>
          {items.map((t, i) => {
            const { priority, text } = extractPriority(t);
            const bulletColor = priority ? PRIORITY_COLORS[priority] : PRIORITY_UNSET_COLOR;
            return (
              <li key={i} style={{ "--bullet-color": "#" + bulletColor }}>
                <span className="dot" />
                <BulletText text={text} />
              </li>
            );
          })}
        </ul>
      )}
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
export default function SlideCanvas({ data, tab, assets, scale, editable, onEditTeam, onEditSection }) {
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
        {editable ? (
          <input
            className="ctitle-edit"
            value={data.teamName}
            onChange={(e) => onEditTeam(e.target.value)}
          />
        ) : (
          <div className="ctitle">{data.teamName}</div>
        )}
        <div className="cline" />
        <div className="csub">{data.subtitle}</div>
      </div>
    );
  } else {
    const bars = bandBars(data);
    const cardsTop = cardsTopFor(data);
    const { fs: FS, sections } = fitSectionItems(data, cardsTop);
    const natural = rowHeights(sections, FS);
    const { topH, botH } = stretchRowHeights(natural.topH, natural.botH, cardsTop);
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
        <Card x={G.X_L} y={cardsTop} w={G.COL_W} h={topH} items={sections.done} rawItems={data.done} sec={SEC.done} fontSize={FS}
          editable={editable} onEditText={onEditSection && ((t) => onEditSection("done", t))} />
        <Card x={G.X_L} y={yBot} w={G.COL_W} h={botH} items={sections.risk} rawItems={data.risk} sec={SEC.risk} fontSize={FS}
          editable={editable} onEditText={onEditSection && ((t) => onEditSection("risk", t))} />
        <Card x={G.X_R} y={cardsTop} w={G.COL_W} h={topH} items={sections.active} rawItems={data.active} sec={SEC.active} fontSize={FS}
          editable={editable} onEditText={onEditSection && ((t) => onEditSection("active", t))} />
        <Card x={G.X_R} y={yBot} w={G.COL_W} h={botH} items={sections.pending} rawItems={data.pending} sec={SEC.pending} fontSize={FS}
          editable={editable} onEditText={onEditSection && ((t) => onEditSection("pending", t))} />
        <div className="s-footer">
          Gizli &amp; Dahili Kullanım&nbsp;&nbsp;|&nbsp;&nbsp;Scrum Ekibi – Planlama Toplantısı
          {hasPriorityTags(data) && <PriorityLegend />}
        </div>
      </>
    );
  }

  return (
    <div className={`slidecanvas tab-${tab}`} style={{ transform: `scale(${scale})` }}>
      {content}
    </div>
  );
}
