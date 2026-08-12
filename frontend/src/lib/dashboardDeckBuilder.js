import { nfmtInt, dStatus, barColor, DAV_COLORS, CARD_TONES, buildSummaryCards, personTotals } from "./format";
import { logoPositions } from "./geometry";
import { resolveTableHeaders } from "./dashboardTableHeaders";
import { DEFAULT_CORNER_MESH } from "../assets/cornerMesh";

// Resim1 kose-mesh dekorasyonunun gercek en-boy orani (658x960 kaynak PNG).
const CORNER_MESH_RATIO = 658 / 960;

// Onizlemedeki koyu tema paleti (bkz. theme.css .theme-dark .slidecanvas.tab-dashboard)
// ile birebir ayni degerler - "PPTX koyu temada da onizlemeyle eslessin" istegi.
const DASH_PALETTE = {
  light: { PANEL: "F1F5F7", CARDBG: "FFFFFF", INK: "1F2937", MUT: "6B7280", LINE: "E5E7EB", TITLE: "1F2937" },
  dark: { PANEL: "131C27", CARDBG: "1C2733", INK: "E7EDF5", MUT: "9CB0C6", LINE: "3A4756", TITLE: "4A9FE0" },
};

/**
 * Kapasite dashboard slaydini verilen pptx'e ekler - buildFullDeck tarafindan
 * kullanilir. Canli onizlemedeki (DashboardSlideCanvas) ile BIREBIR AYNI
 * duzeni kullanir. dd (dashboard data) su alanlari icerir:
 * team, sprintNo, dateRange, reportDate, kpis{toplam,tamamlanan,acik,kapasite,doluluk,acikFazla,durum},
 * persons[{name,role,initials,toplam,tamamlanan,acik,kapasite,doluluk,durum}], delta, deltaRange.
 */
export function addDashboardSlide(pptx, dd, assets, theme = "light", cornerMesh = DEFAULT_CORNER_MESH) {
  const P = DASH_PALETTE[theme] || DASH_PALETTE.light;
  const INK = P.INK, MUT = P.MUT, LINE = P.LINE, CARDBG = P.CARDBG, PANEL = P.PANEL;

  const s = pptx.addSlide();
  s.background = { color: PANEL };
  // Hafif, dikkat dagitmayan arka plan cilasi - bkz. sprintDeckBuilder.
  // addContentSlide'daki AYNI teknik/yorum ("PPTX'lere güzel yakışır bir arka
  // tema" - kullanici bildirimi), kapasite dashboard slaydina da uygulanir.
  s.addShape(pptx.ShapeType.ellipse, { x: 10.6, y: -2.6, w: 6.5, h: 6.5, fill: { color: "4A9FE0", transparency: 93 }, line: { type: "none" } });
  s.addShape(pptx.ShapeType.ellipse, { x: -3.2, y: 4.6, w: 6.5, h: 6.5, fill: { color: "8DC63F", transparency: 94 }, line: { type: "none" } });
  // Sablon (Resim1) dekorasyonu - sol kenar boşluğunda (KPI kartlari x=0.4'te,
  // "Kişi" kolonu da x=0.4'te baslar - x=0..0.4 arasi HER ZAMAN bos kalir,
  // satir sayisindan bagimsiz), tablo/kartlarin ARKASINDA. Eskiden sag-altta
  // "Durum" kolonunun ustune biniyordu (bkz. kullanici bildirimi: "kapasite
  // sayfasında ise çok yanlış bir yerde") - icerik slaytiyla AYNI sol-alt
  // yerlesime tasindi, flipH ile "sivri uc" slaytin icine dogru baksin.
  if (cornerMesh) {
    const cmW = 1.9, cmH = cmW / CORNER_MESH_RATIO;
    // x: eskiden neredeyse tamami slayt disina taşiyordu (bkz. kullanici
    // bildirimi: "hala sayfa dışında kalıyor") - artik gorselin yaklasik
    // yarisi slayt icinde gorunur kalacak sekilde saga kaydirildi.
    s.addImage({ data: cornerMesh, x: -cmW * 0.42, y: 7.5 - cmH + 0.15, w: cmW, h: cmH, transparency: 45, flipH: true });
  }
  s.addText((dd.team || "") + " Kapasite Planı", { x: 0.4, y: 0.26, w: 9, h: 0.5, fontFace: "Calibri", fontSize: 24, bold: true, color: P.TITLE, margin: 0 });
  s.addText((dd.sprintNo ? "Sprint " + dd.sprintNo + "   •   " : "") + dd.dateRange + "   •   Rapor Tarihi: " + dd.reportDate, { x: 0.42, y: 0.76, w: 9, h: 0.3, fontFace: "Calibri", fontSize: 11, color: MUT, margin: 0 });
  // Onizlemedeki .dlogos (right:24px, top:22px, flex row, img height:30px) ile
  // birebir ayni konumlandirma - bkz. geometry.js/logoPositions.
  const dashLogos = logoPositions({ rightEdge: 13.196, top: 0.231, height: 0.315, gap: 0.084 });
  s.addImage({ data: assets.logo_b, ...dashLogos.b });
  s.addImage({ data: assets.logo_a, ...dashLogos.a });
  // Takim bilgisi (baslik+alt satir) altindaki serit - icerik slaydiyla AYNI
  // marka renkli "bayrak" cizgisi (bkz. kullanici bildirimi), bu slaytta
  // eskiden hic yoktu.
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 1.1, w: 3.4, h: 0.045, fill: { color: "164E63" } });
  s.addShape(pptx.ShapeType.rect, { x: 3.4, y: 1.1, w: 13.333 - 3.4, h: 0.045, fill: { color: "E67514" } });

  s.addText("Ekip Özet", { x: 0.4, y: 1.14, w: 4, h: 0.2, fontFace: "Calibri", fontSize: 9, bold: true, color: MUT, margin: 0, charSpacing: 1 });
  const cards = buildSummaryCards(dd);
  const KX = 0.4, KW = 12.53, KGAP = 0.16, KY = 1.36, KH = 1.3, cw = (KW - (cards.length - 1) * KGAP) / cards.length;
  cards.forEach((c, i) => {
    const x = KX + i * (cw + KGAP);
    const tone = c.toneName ? CARD_TONES[c.toneName] : null;
    s.addShape(pptx.ShapeType.roundRect, { x, y: KY, w: cw, h: KH, rectRadius: 0.06, fill: { color: tone ? tone.bg : CARDBG }, line: { color: tone ? tone.border : LINE, width: 1 } });
    s.addText(c.label, { x: x + 0.1, y: KY + 0.1, w: cw - 0.2, h: 0.4, fontFace: "Calibri", fontSize: 9, color: MUT, margin: 0, valign: "top", fit: "shrink" });
    s.addText(String(c.value), { x: x + 0.1, y: KY + 0.42, w: cw - 0.2, h: 0.56, fontFace: "Calibri", fontSize: c.text ? 15 : 24, bold: true, color: tone ? tone.fg : INK, margin: 0, valign: "middle", fit: "shrink" });
    s.addText(c.sub, { x: x + 0.1, y: KY + KH - 0.3, w: cw - 0.2, h: 0.24, fontFace: "Calibri", fontSize: 7.5, color: MUT, margin: 0, valign: "middle", fit: "shrink" });
  });

  let curY = KY + KH + 0.2;
  if (dd.delta) {
    const d = dd.delta;
    const noteParts = [
      d.kapanan !== "" && d.kapanan != null ? "Dönem Kapanan: " + nfmtInt(d.kapanan) + " A/G" : null,
      d.fte !== "" && d.fte != null ? "Canlıya Alınan FTE: " + String(d.fte).trim() : null,
    ].filter(Boolean);
    if (noteParts.length) {
      s.addText(noteParts.join("   •   "), { x: 0.42, y: curY, w: 12.4, h: 0.24, fontFace: "Calibri", fontSize: 9, color: MUT, margin: 0 });
      curY += 0.3;
    }
  }

  s.addText("Kişi Bazlı Kapasite Özeti", { x: 0.4, y: curY, w: 6, h: 0.34, fontFace: "Calibri", fontSize: 14, bold: true, color: INK, margin: 0 });
  const TY = curY + 0.42;
  const cols = { kisi: [0.4, 2.7], tam: [3.15, 1.15], acik: [4.35, 1.15], kap: [5.55, 1.15], dol: [6.75, 4.45], durum: [11.3, 1.63] };
  const HH = 0.52;
  const AGP = (t) => [{ text: t, options: { fontSize: 8.3, color: MUT, bold: false } }, { text: "\n(AG)", options: { fontSize: 6.6, color: "9AA3AF" } }];
  const plain = (t) => [{ text: t, options: { fontSize: 8.3, color: MUT, bold: false } }];
  const th = resolveTableHeaders(dd.tableHeaders);
  [
    [plain(th.kisi), cols.kisi, "left"],
    [AGP(th.tamamlanan), cols.tam, "center"],
    [AGP(th.acik), cols.acik, "center"],
    [AGP(th.kapasite), cols.kap, "center"],
    [plain(th.doluluk), cols.dol, "left"],
    [plain(th.durum), cols.durum, "center"],
  ].forEach(([t, col, al]) => s.addText(t, { x: col[0], y: TY, w: col[1], h: HH, fontFace: "Calibri", align: al, valign: "bottom", margin: 0, lineSpacingMultiple: 0.95 }));
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: TY + HH, w: 12.53, h: 0, line: { color: LINE, width: 1 } });

  const persons = dd.persons || [];
  const TOTAL_ROW_H = persons.length ? 0.46 : 0;
  const availH = 7.28 - (TY + HH + 0.06) - TOTAL_ROW_H;
  const rowH = Math.min(0.62, Math.max(0.4, availH / Math.max(1, persons.length)));
  persons.forEach((p, i) => {
    const y = TY + HH + 0.06 + i * rowH, cy = y + rowH / 2, ps = dStatus(p.durum, p.doluluk), av = DAV_COLORS[i % DAV_COLORS.length], ad = Math.min(0.42, rowH - 0.14);
    s.addShape(pptx.ShapeType.ellipse, { x: cols.kisi[0], y: cy - ad / 2, w: ad, h: ad, fill: { color: av }, line: { type: "none" } });
    s.addText((p.initials || p.name.slice(0, 2)).toUpperCase(), { x: cols.kisi[0], y: cy - ad / 2, w: ad, h: ad, fontFace: "Calibri", fontSize: 8.5, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(
      [{ text: p.name, options: { bold: true, color: INK, fontSize: 11 } }, ...(p.role ? [{ text: "\n" + p.role, options: { color: MUT, fontSize: 8 } }] : [])],
      { x: cols.kisi[0] + ad + 0.14, y, w: cols.kisi[1] - ad - 0.16, h: rowH, valign: "middle", margin: 0, fontFace: "Calibri" }
    );
    const nc = (col, val, bold) => s.addText(String(val), { x: col[0], y, w: col[1], h: rowH, fontFace: "Calibri", fontSize: 11.5, bold: !!bold, color: INK, align: "center", valign: "middle", margin: 0 });
    nc(cols.tam, nfmtInt(p.tamamlanan));
    nc(cols.acik, nfmtInt(p.acik), true);
    nc(cols.kap, nfmtInt(p.kapasite));
    const barX = cols.dol[0], barW = 3.6, barH = 0.16, barY = cy - barH / 2;
    s.addShape(pptx.ShapeType.roundRect, { x: barX, y: barY, w: barW, h: barH, rectRadius: 0.08, fill: { color: "E5E7EB" }, line: { type: "none" } });
    s.addShape(pptx.ShapeType.roundRect, { x: barX, y: barY, w: Math.max(0.05, Math.min(1, Number(p.doluluk)) * barW), h: barH, rectRadius: 0.08, fill: { color: barColor(p.doluluk) }, line: { type: "none" } });
    s.addText("%" + Math.round(p.doluluk * 100), { x: barX + barW + 0.08, y, w: 0.7, h: rowH, fontFace: "Calibri", fontSize: 10, bold: true, color: INK, align: "left", valign: "middle", margin: 0 });
    s.addShape(pptx.ShapeType.roundRect, { x: cols.durum[0] + 0.1, y: cy - 0.16, w: cols.durum[1] - 0.2, h: 0.32, rectRadius: 0.16, fill: { color: ps.bg }, line: { color: ps.fg, width: 0.75 } });
    s.addText(ps.label, { x: cols.durum[0] + 0.1, y: cy - 0.16, w: cols.durum[1] - 0.2, h: 0.32, fontFace: "Calibri", fontSize: 9, bold: true, color: ps.fg, align: "center", valign: "middle", margin: 0 });
    if (i < persons.length - 1) s.addShape(pptx.ShapeType.line, { x: 0.4, y: y + rowH, w: 12.53, h: 0, line: { color: "F1F3F5", width: 0.75 } });
  });

  if (persons.length) {
    const totals = personTotals(persons);
    const totalY = TY + HH + 0.06 + persons.length * rowH + 0.1, totalH = TOTAL_ROW_H - 0.1;
    s.addShape(pptx.ShapeType.line, { x: 0.4, y: totalY - 0.04, w: 12.53, h: 0, line: { color: INK, width: 1.25 } });
    s.addText("EKİP TOPLAMI", { x: cols.kisi[0], y: totalY, w: cols.kisi[1], h: totalH, fontFace: "Calibri", fontSize: 11, bold: true, color: INK, valign: "middle", margin: 0 });
    const totalBox = (col, val) => {
      s.addShape(pptx.ShapeType.roundRect, { x: col[0], y: totalY, w: col[1], h: totalH, rectRadius: 0.05, fill: { color: CARDBG }, line: { color: LINE, width: 1 } });
      s.addText(String(val), { x: col[0], y: totalY, w: col[1], h: totalH, fontFace: "Calibri", fontSize: 12, bold: true, color: INK, align: "center", valign: "middle", margin: 0 });
    };
    totalBox(cols.tam, nfmtInt(totals.tamamlanan));
    totalBox(cols.acik, nfmtInt(totals.acik));
    totalBox(cols.kap, nfmtInt(totals.kapasite));
  }

  s.addText((dd.team || "") + " Kapasite Dashboard", { x: 8.5, y: 7.16, w: 4.4, h: 0.28, fontFace: "Calibri", fontSize: 8, color: "9AA3AF", align: "right", margin: 0 });
  return s;
}
