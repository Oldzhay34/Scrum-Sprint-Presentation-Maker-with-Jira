import PptxGenJS from "pptxgenjs";
import { G, SEGCOL, BAND, bandBars, pickFS, rowHeights, parseRuns, num, sectionDefs } from "./geometry";

/**
 * Sprint sunumu PPTX'ini uretir. Canli onizlemedeki (SlideCanvas) ile
 * BIREBIR AYNI geometriyi (lib/geometry.js) kullanir.
 */
export function buildSprintDeck(data, assets) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  const TEAL = "164E63", ORANGE = "E67514", INK = "1F2937", LINE = "E5E7EB";
  const SEC = sectionDefs(assets);

  // kapak
  const s1 = pptx.addSlide();
  s1.background = { color: "FFFFFF" };
  if (assets.cover_bg) s1.addImage({ data: assets.cover_bg, x: 0, y: 0, w: 13.333, h: 7.5 });
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.4, h: 7.5, fill: { color: "FFFFFF", transparency: 22 } });
  s1.addImage({ data: assets.logo_a, x: 0.55, y: 0.42, w: 1.35, h: 1.35 * (63 / 308) });
  s1.addImage({ data: assets.logo_b, x: 2.15, y: 0.36, w: 1.05, h: 1.05 * (83 / 227) });
  s1.addText(data.teamName || "Yapay Zeka Ekibi", { x: 0.55, y: 5.15, w: 8.0, h: 0.9, fontFace: "Calibri", fontSize: 40, bold: true, color: TEAL, margin: 0 });
  s1.addShape(pptx.ShapeType.line, { x: 0.6, y: 6.05, w: 2.6, h: 0, line: { color: ORANGE, width: 2.25 } });
  s1.addText(data.subtitle, { x: 0.55, y: 6.12, w: 9.0, h: 0.5, fontFace: "Calibri", fontSize: 18, color: INK, margin: 0 });

  // icerik
  const s2 = pptx.addSlide();
  s2.background = { color: "FFFFFF" };
  s2.addText(data.subtitle, { x: 0.4, y: 0.24, w: 9.8, h: 0.6, fontFace: "Calibri", fontSize: 25, bold: true, color: TEAL, margin: 0, valign: "middle" });
  s2.addImage({ data: assets.logo_b, x: 11.05, y: 0.16, w: 0.95, h: 0.95 * (83 / 227) });
  s2.addImage({ data: assets.logo_a, x: 11.35, y: 0.62, w: 1.55, h: 1.55 * (63 / 308) });
  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 1.02, w: 13.333, h: 0.035, fill: { color: ORANGE } });

  const bars = bandBars(data);
  function drawBand() {
    const n = bars.length;
    if (!n) return G.Y_TOP;
    const barW = (BAND.W - (n - 1) * BAND.GAP) / n;
    bars.forEach((bar, i) => {
      const bx = BAND.X + i * (barW + BAND.GAP);
      const labelW = Math.min(1.2, Math.max(0.55, barW * 0.32));
      s2.addShape(pptx.ShapeType.rect, { x: bx, y: BAND.Y, w: labelW, h: BAND.H, fill: { color: TEAL } });
      s2.addText((bar.label || "").toUpperCase(), { x: bx + 0.03, y: BAND.Y, w: labelW - 0.06, h: BAND.H, fontFace: "Calibri", fontSize: 8.5, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, fit: "shrink" });
      const segX0 = bx + labelW + 0.04, segW = barW - labelW - 0.04;
      const segs = bar.segments.filter((s) => s && String(s.value).trim() !== "");
      const sum = segs.reduce((a, s) => a + Math.max(0.0001, num(s.value)), 0) || 1;
      let cx = segX0;
      segs.forEach((s) => {
        const w = Math.max(0.14, (num(s.value) / sum) * segW);
        s2.addShape(pptx.ShapeType.rect, { x: cx, y: BAND.Y, w, h: BAND.H, fill: { color: SEGCOL[s.color] || "456BBA" } });
        s2.addText(String(s.value), { x: cx, y: BAND.Y, w, h: BAND.H, fontFace: "Calibri", fontSize: 10, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
        cx += w;
      });
    });
    return BAND.Y + BAND.H + 0.16;
  }

  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 7.14, w: 13.333, h: 0.36, fill: { color: TEAL } });
  s2.addText("Gizli & Dahili Kullanım   |   Scrum Ekibi – Planlama Toplantısı", { x: 0.4, y: 7.14, w: 9, h: 0.36, fontFace: "Calibri", fontSize: 10, color: "D6E4EA", margin: 0, valign: "middle" });

  const CARDS_TOP = drawBand();
  const FS = pickFS(data, CARDS_TOP);
  const { topH, botH } = rowHeights(data, FS);

  function drawCard(x, y, items, sec, fs2, h) {
    s2.addShape(pptx.ShapeType.roundRect, { x, y, w: G.COL_W, h, rectRadius: 0.06, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, shadow: { type: "outer", color: "9CA3AF", blur: 6, offset: 2, angle: 90, opacity: 0.28 } });
    s2.addShape(pptx.ShapeType.roundRect, { x: x + 0.07, y: y + 0.12, w: 0.075, h: h - 0.24, rectRadius: 0.04, fill: { color: sec.accent }, line: { type: "none" } });
    s2.addImage({ data: sec.icon, x: x + G.ACC_ZONE, y: y + G.PAD_T + 0.02, w: G.ICON, h: G.ICON });
    s2.addText(sec.title, { x: x + G.ACC_ZONE + G.ICON + 0.12, y: y + G.PAD_T, w: G.COL_W - G.ACC_ZONE - G.ICON - 0.3, h: G.TITLE_H - 0.06, fontFace: "Calibri", fontSize: 14.5, bold: true, color: sec.accent, valign: "middle", margin: 0 });
    if (items.length) {
      const runs = items
        .map((t, i) => {
          const para = parseRuns(t).map((r) => ({ text: r.text, options: { bold: r.bold, color: r.bold ? INK : "374151" } }));
          para[0].options = Object.assign({}, para[0].options, { bullet: { code: "2022", indent: 12 }, paraSpaceAfter: G.BUL_GAP * 72, breakLine: true });
          para[para.length - 1].options = Object.assign({}, para[para.length - 1].options, { breakLine: i < items.length - 1 });
          return para;
        })
        .flat();
      s2.addText(runs, { x: x + G.ACC_ZONE, y: y + G.PAD_T + G.TITLE_H, w: G.COL_W - G.ACC_ZONE - G.PAD_R, h: h - G.PAD_T - G.TITLE_H - G.PAD_B + 0.05, fontFace: "Calibri", fontSize: fs2, color: "374151", valign: "top", margin: 0, lineSpacingMultiple: 1.0 });
    }
    return h;
  }

  const yBot = CARDS_TOP + topH + G.GAP_Y;
  drawCard(G.X_L, CARDS_TOP, data.done, SEC.done, FS, topH);
  drawCard(G.X_L, yBot, data.risk, SEC.risk, FS, botH);
  drawCard(G.X_R, CARDS_TOP, data.active, SEC.active, FS, topH);
  drawCard(G.X_R, yBot, data.pending, SEC.pending, FS, botH);

  return pptx;
}
