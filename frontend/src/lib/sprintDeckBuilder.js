import {
  G, SEGCOL, BAND, bandBars, fitContent, parseRuns, sectionDefs, gapAt, extractPriority,
  extractComment, PRIORITY_COLORS, PRIORITY_ORDER, PRIORITY_UNSET_LABEL, PRIORITY_UNSET_COLOR, hasPriorityTags, logoPositions,
  segmentWidths,
} from "./geometry";

/** Kapak slaydini verilen pptx'e ekler - buildFullDeck tarafindan kullanilir. */
export function addCoverSlide(pptx, data, assets) {
  const TEAL = "164E63", ORANGE = "E67514", INK = "1F2937";
  const s1 = pptx.addSlide();
  s1.background = { color: "FFFFFF" };
  if (assets.cover_bg) s1.addImage({ data: assets.cover_bg, x: 0, y: 0, w: 13.333, h: 7.5 });
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.4, h: 7.5, fill: { color: "FFFFFF", transparency: 22 } });
  s1.addImage({ data: assets.logo_a, x: 0.55, y: 0.42, w: 1.35, h: 1.35 * (63 / 308) });
  s1.addImage({ data: assets.logo_b, x: 2.15, y: 0.36, w: 1.05, h: 1.05 * (83 / 227) });
  s1.addText(data.teamName || "Yapay Zeka Ekibi", { x: 0.55, y: 5.15, w: 8.0, h: 0.9, fontFace: "Calibri", fontSize: 40, bold: true, color: TEAL, margin: 0 });
  s1.addShape(pptx.ShapeType.line, { x: 0.6, y: 6.05, w: 2.6, h: 0, line: { color: ORANGE, width: 2.25 } });
  s1.addText(data.subtitle, { x: 0.55, y: 6.12, w: 9.0, h: 0.5, fontFace: "Calibri", fontSize: 18, color: INK, margin: 0 });
  return s1;
}

// Onizlemedeki koyu tema paleti (bkz. theme.css .theme-dark .slidecanvas.tab-content)
// ile birebir ayni degerler - "PPTX koyu temada da onizlemeyle eslessin" istegi.
const CONTENT_PALETTE = {
  light: { PAGE_BG: "FFFFFF", CARD_BG: "FFFFFF", HEADER: "164E63", CARD_LINE: "E5E7EB", TXT_BOLD: "1F2937", TXT_NORMAL: "374151" },
  dark: { PAGE_BG: "131C27", CARD_BG: "1C2733", HEADER: "4A9FE0", CARD_LINE: "3A4756", TXT_BOLD: "E7EDF5", TXT_NORMAL: "B7C4D3" },
};

/** Icerik slaydini verilen pptx'e ekler - buildFullDeck tarafindan kullanilir. */
export function addContentSlide(pptx, data, assets, theme = "light") {
  const P = CONTENT_PALETTE[theme] || CONTENT_PALETTE.light;
  const TEAL = "164E63", ORANGE = "E67514";
  const SEC = sectionDefs(assets);

  const s2 = pptx.addSlide();
  s2.background = { color: P.PAGE_BG };
  s2.addText(data.subtitle, { x: 0.4, y: 0.24, w: 9.8, h: 0.6, fontFace: "Calibri", fontSize: 25, bold: true, color: P.HEADER, margin: 0, valign: "middle" });
  // Onizlemedeki .s-logos (right:24px, top:14px, flex row, img height:34px) ile
  // birebir ayni konumlandirma - bkz. geometry.js/logoPositions.
  const contentLogos = logoPositions({ rightEdge: 13.195, top: 0.147, height: 0.357, gap: 0.084 });
  s2.addImage({ data: assets.logo_b, ...contentLogos.b });
  s2.addImage({ data: assets.logo_a, ...contentLogos.a });
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
      // segmentWidths, degere ORANTILI genislik yerine once her segmentin
      // KENDI metnini (orn. "1.26") tek satirda gosterebilecegi bir taban
      // genislik ayirir - onceki surumde kucuk bir oran, uzun bir metinden
      // dar bir kutu demekti ve PowerPoint metni IKI SATIRA kirip (fit:"shrink"
      // burada hic yoktu) gorsel olarak bozuk/tasmis gosteriyordu.
      const widths = segmentWidths(segs, segW);
      let cx = segX0;
      segs.forEach((s, si) => {
        const w = widths[si];
        s2.addShape(pptx.ShapeType.rect, { x: cx, y: BAND.Y, w, h: BAND.H, fill: { color: SEGCOL[s.color] || "456BBA" } });
        s2.addText(String(s.value), { x: cx, y: BAND.Y, w, h: BAND.H, fontFace: "Calibri", fontSize: 10, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, fit: "shrink" });
        cx += w;
      });
    });
    return BAND.Y + BAND.H + 0.16;
  }

  const footerTeam = (data.teamName || "Ekip").trim();
  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 7.14, w: 13.333, h: 0.36, fill: { color: TEAL } });
  s2.addText(`Gizli & Dahili Kullanım   |   ${footerTeam}`, { x: 0.4, y: 7.14, w: 7, h: 0.36, fontFace: "Calibri", fontSize: 10, color: "D6E4EA", margin: 0, valign: "middle" });

  if (hasPriorityTags(data)) {
    const legendEntries = [...PRIORITY_ORDER.map((p) => [p, PRIORITY_COLORS[p]]), [PRIORITY_UNSET_LABEL, PRIORITY_UNSET_COLOR]];
    const legendRuns = legendEntries.flatMap(([label, color], i) => [
      ...(i > 0 ? [{ text: "     ", options: {} }] : []),
      { text: "●  ", options: { color, fontSize: 9 } },
      { text: label, options: { color: "D6E4EA" } },
    ]);
    s2.addText(legendRuns, { x: 6.6, y: 7.14, w: 6.3, h: 0.36, fontFace: "Calibri", fontSize: 9.5, margin: 0, valign: "middle", align: "right" });
  }

  const CARDS_TOP = drawBand();
  const { sections, fsByKey, topH, botH } = fitContent(data, CARDS_TOP);

  function drawCard(x, y, items, sec, fs2, h) {
    s2.addShape(pptx.ShapeType.roundRect, { x, y, w: G.COL_W, h, rectRadius: 0.06, fill: { color: P.CARD_BG }, line: { color: P.CARD_LINE, width: 1 }, shadow: { type: "outer", color: "9CA3AF", blur: 6, offset: 2, angle: 90, opacity: 0.28 } });
    s2.addShape(pptx.ShapeType.roundRect, { x: x + 0.07, y: y + 0.12, w: 0.075, h: h - 0.24, rectRadius: 0.04, fill: { color: sec.accent }, line: { type: "none" } });
    s2.addImage({ data: sec.icon, x: x + G.ACC_ZONE, y: y + G.PAD_T + 0.02, w: G.ICON, h: G.ICON });
    s2.addText(sec.title, { x: x + G.ACC_ZONE + G.ICON + 0.12, y: y + G.PAD_T, w: G.COL_W - G.ACC_ZONE - G.ICON - 0.3, h: G.TITLE_H - 0.06, fontFace: "Calibri", fontSize: 14.5, bold: true, color: sec.accent, valign: "middle", margin: 0 });
    if (items.length) {
      const runs = items
        .map((t, i) => {
          const { text: withoutComment, comment: rawComment } = extractComment(t);
          const comment = rawComment.trim();
          const { priority, text } = extractPriority(withoutComment);
          const bulletColor = priority ? PRIORITY_COLORS[priority] : PRIORITY_UNSET_COLOR;
          const mainRuns = parseRuns(text).map((r) => ({ text: r.text, options: { bold: r.bold, color: r.bold ? P.TXT_BOLD : P.TXT_NORMAL } }));
          if (priority) {
            // Renkli/kalin bir metin etiketi ("KRİTİK " gibi) - bkz. asagidaki dot
            // ile ayni renk mantigi.
            mainRuns.unshift({ text: priority.toUpperCase() + "  ", options: { bold: true, color: bulletColor } });
          }
          // Oncelik noktasi: pptxgenjs/PowerPoint'te native "bullet" ozelliginin
          // rengi (bullet:{color}) guvenilir basilmiyor - oncelik BELIRTILMEMIS
          // maddelerde (bkz. kullanici bildirimi) bu yuzden PRIORITY_UNSET_COLOR
          // (siyaha yakin) yerine PowerPoint'in varsayilan/tema rengi (gri, "Düşük"
          // ile ayni gorunen) basiliyordu. Guvenilir tek yol, noktayi normal bir
          // METIN karakteri olarak (native bullet KULLANMADAN) elle eklemek -
          // oncelik etiketinde ("KRİTİK " gibi) zaten kullanilan ayni yontem.
          mainRuns.unshift({ text: "●  ", options: { color: bulletColor } });
          // NOT: burada breakLine SET EDILMEZ - mainRuns[0] madde metninin
          // sadece ILK run'i olabilir (orn. "metin " + "**Departman**" gibi
          // ic ice bold varsa). breakLine, madde SONUNDAKI run'a (asagida,
          // yorum/isLastItem mantigiyla) ait bir ozellik - buraya konursa
          // bold departman/etiket parcasi, ait oldugu satirdan kopup bir
          // ALT SATIRA duserdi (bkz. kullanici bildirimi: "bold yazılar
          // aşağı satıra kayıyor").
          mainRuns[0].options = Object.assign({}, mainRuns[0].options, {
            paraSpaceAfter: gapAt(fs2) * 72,
          });
          const isLastItem = i === items.length - 1;
          if (comment) {
            // Maddeye ozel yorum: ana metnin hemen altina, agac (tree) gorunumunde
            // ("  * yorum") ve yesil serit (highlight) ile vurgulanmis bir alt satir
            // olarak eklenir - bkz. SlideCanvas.jsx'teki .item-comment ile
            // onizlemede ayni gorsel dil (emoji kullanilmaz).
            mainRuns[mainRuns.length - 1].options = Object.assign({}, mainRuns[mainRuns.length - 1].options, { breakLine: true });
            mainRuns.push({
              text: "  * " + comment,
              options: {
                italic: true,
                color: "166534",
                highlight: "D1FAE5",
                fontSize: fs2 * 0.84,
                breakLine: !isLastItem,
                paraSpaceAfter: gapAt(fs2) * 72,
              },
            });
          } else {
            mainRuns[mainRuns.length - 1].options = Object.assign({}, mainRuns[mainRuns.length - 1].options, { breakLine: !isLastItem });
          }
          return mainRuns;
        })
        .flat();
      s2.addText(runs, {
        x: x + G.ACC_ZONE, y: y + G.PAD_T + G.TITLE_H, w: G.COL_W - G.ACC_ZONE - G.PAD_R, h: h - G.PAD_T - G.TITLE_H - G.PAD_B + 0.05,
        fontFace: "Calibri", fontSize: fs2, color: P.TXT_NORMAL, valign: "top", margin: 0, lineSpacingMultiple: 1.0,
        // Onizlemedeki (geometry.js/fitContent) font hesabi bir TAHMIN (karakter/
        // satir yaklasimidir) - gercek PowerPoint metin sarma davranisiyla birebir
        // eslesmeyebilir. fit:"shrink", PowerPoint'in kendi autofit motorunu devreye
        // sokup kutuya HIC BIR ZAMAN tasmayacagini garanti eder (guvenlik agi).
        fit: "shrink",
      });
    }
    return h;
  }

  const yBot = CARDS_TOP + topH + G.GAP_Y;
  drawCard(G.X_L, CARDS_TOP, sections.done, SEC.done, fsByKey.done, topH);
  drawCard(G.X_L, yBot, sections.risk, SEC.risk, fsByKey.risk, botH);
  drawCard(G.X_R, CARDS_TOP, sections.active, SEC.active, fsByKey.active, topH);
  drawCard(G.X_R, yBot, sections.pending, SEC.pending, fsByKey.pending, botH);

  return s2;
}
