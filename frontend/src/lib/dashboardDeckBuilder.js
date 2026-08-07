import { nfmtInt } from "./format";
import { dStatus, barColor, DAV_COLORS } from "./format";
import { logoPositions } from "./geometry";
import { resolveTableHeaders } from "./dashboardTableHeaders";
import { DEFAULT_CORNER_MESH } from "../assets/cornerMesh";

// Resim1 kose-mesh dekorasyonunun gercek en-boy orani (658x960 kaynak PNG).
const CORNER_MESH_RATIO = 658 / 960;

// Onizlemedeki koyu tema paleti (bkz. theme.css .theme-dark .slidecanvas.tab-dashboard)
// ile birebir ayni degerler - "PPTX koyu temada da onizlemeyle eslessin" istegi.
const DASH_PALETTE = {
  light: { PANEL: "F1F5F7", CARDBG: "FFFFFF", INK: "1F2937", MUT: "6B7280", LINE: "E5E7EB", TITLE: "1F2937", DELTA_HL_BG: "FEF2F2", DELTA_HL_BORDER: "FCA5A5", DELTA_HL_TXT: "B91C1C" },
  dark: { PANEL: "131C27", CARDBG: "1C2733", INK: "E7EDF5", MUT: "9CB0C6", LINE: "3A4756", TITLE: "4A9FE0", DELTA_HL_BG: "3A1F22", DELTA_HL_BORDER: "FCA5A5", DELTA_HL_TXT: "FCA5A5" },
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

  const k = dd.kpis, dur = dStatus(k.durum, k.doluluk);
  const cards = [
    ["Toplam İş Yükü", nfmtInt(k.toplam), "A/G", INK, false],
    ["Tamamlanan İş Yükü", nfmtInt(k.tamamlanan), "A/G", "16A34A", false],
    ["Açık İş Yükü", nfmtInt(k.acik), "A/G", INK, false],
    ["Kullanılabilir Kapasite", nfmtInt(k.kapasite), "A/G", "2563EB", false],
    ["Bakımlı Doluluk", "%" + Math.round(k.doluluk * 100), "Bakım/SR sonrası %", dur.bar, false],
    ["Kapasite Açığı / Fazlası", nfmtInt(k.acikFazla), "A/G", k.acikFazla < 0 ? "DC2626" : INK, false],
    ["Genel Durum", dur.label, "Doluluk eşiklerine göre", dur.fg, true],
    ...(dd.customKpis || []).map((c) => [c.label, String(c.value), c.unit || "", "7C3AED", true]),
  ];
  const KX = 0.4, KW = 12.53, KGAP = 0.14, KY = 1.28, KH = 1.08, cw = (KW - (cards.length - 1) * KGAP) / cards.length;
  cards.forEach((c, i) => {
    const x = KX + i * (cw + KGAP);
    s.addShape(pptx.ShapeType.roundRect, { x, y: KY, w: cw, h: KH, rectRadius: 0.05, fill: { color: CARDBG }, line: { color: LINE, width: 1 } });
    s.addText(c[0], { x: x + 0.08, y: KY + 0.08, w: cw - 0.16, h: 0.34, fontFace: "Calibri", fontSize: 8.2, color: MUT, margin: 0, valign: "top", fit: "shrink" });
    s.addText(String(c[1]), { x: x + 0.08, y: KY + 0.36, w: cw - 0.16, h: 0.46, fontFace: "Calibri", fontSize: c[4] ? 12.5 : 19, bold: true, color: c[3], margin: 0, valign: "middle", fit: "shrink" });
    s.addText(c[2], { x: x + 0.08, y: KY + KH - 0.26, w: cw - 0.16, h: 0.22, fontFace: "Calibri", fontSize: 6.8, color: MUT, margin: 0, valign: "middle", fit: "shrink" });
  });

  let curY = KY + KH + 0.22;
  if (dd.delta) {
    const d = dd.delta;
    s.addText("Son 2 Hafta", { x: 0.42, y: curY + 0.02, w: 1.7, h: 0.3, fontFace: "Calibri", fontSize: 11, bold: true, color: MUT, margin: 0 });
    if (d.range) s.addText(d.range, { x: 0.42, y: curY + 0.3, w: 1.9, h: 0.26, fontFace: "Calibri", fontSize: 8.5, color: MUT, margin: 0 });
    const dcards = [
      ["Dönem Kapanan İş Yükü", nfmtInt(d.kapanan), false],
      ["Canlıya Alınan FTE", d.fte !== "" ? String(d.fte).trim() : null, false],
      ["Yeni Eklenen İş Yükü", nfmtInt(d.eklenen), false],
      ["Net İş Yükü Değişimi", nfmtInt(d.net), true],
    ].filter((c) => c[1] !== null);
    const DX = 2.4, DW = 13.333 - 0.4 - DX, DGAP = 0.18, DH = 0.72, dw = (DW - (dcards.length - 1) * DGAP) / dcards.length;
    dcards.forEach((c, i) => {
      const x = DX + i * (dw + DGAP);
      s.addShape(pptx.ShapeType.roundRect, { x, y: curY, w: dw, h: DH, rectRadius: 0.05, fill: { color: c[2] ? P.DELTA_HL_BG : CARDBG }, line: { color: c[2] ? P.DELTA_HL_BORDER : LINE, width: 1 } });
      s.addText(c[0], { x: x + 0.1, y: curY + 0.08, w: dw - 0.2, h: 0.26, fontFace: "Calibri", fontSize: 8, color: c[2] ? P.DELTA_HL_TXT : MUT, margin: 0, fit: "shrink" });
      s.addText(String(c[1]), { x: x + 0.1, y: curY + 0.32, w: dw - 0.2, h: 0.34, fontFace: "Calibri", fontSize: 15, bold: true, color: INK, margin: 0, valign: "middle", fit: "shrink" });
    });
    curY += DH + 0.28;
  }

  s.addText("Kişi Bazlı Kapasite Özeti", { x: 0.4, y: curY, w: 6, h: 0.34, fontFace: "Calibri", fontSize: 14, bold: true, color: INK, margin: 0 });
  const TY = curY + 0.42;
  const cols = { kisi: [0.4, 2.7], toplam: [3.15, 1.15], tam: [4.35, 1.15], acik: [5.55, 1.15], kap: [6.75, 1.35], dol: [8.2, 3.05], durum: [11.3, 1.63] };
  const HH = 0.52;
  const AGP = (t) => [{ text: t, options: { fontSize: 8.3, color: MUT, bold: false } }, { text: "\n(AG)", options: { fontSize: 6.6, color: "9AA3AF" } }];
  const plain = (t) => [{ text: t, options: { fontSize: 8.3, color: MUT, bold: false } }];
  const th = resolveTableHeaders(dd.tableHeaders);
  [
    [plain(th.kisi), cols.kisi, "left"],
    [AGP(th.toplam), cols.toplam, "center"],
    [AGP(th.tamamlanan), cols.tam, "center"],
    [AGP(th.acik), cols.acik, "center"],
    [AGP(th.kapasite), cols.kap, "center"],
    [plain(th.doluluk), cols.dol, "left"],
    [plain(th.durum), cols.durum, "center"],
  ].forEach(([t, col, al]) => s.addText(t, { x: col[0], y: TY, w: col[1], h: HH, fontFace: "Calibri", align: al, valign: "bottom", margin: 0, lineSpacingMultiple: 0.95 }));
  s.addShape(pptx.ShapeType.line, { x: 0.4, y: TY + HH, w: 12.53, h: 0, line: { color: LINE, width: 1 } });

  const persons = dd.persons || [];
  const availH = 7.28 - (TY + HH + 0.06);
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
    nc(cols.toplam, nfmtInt(p.toplam));
    nc(cols.tam, nfmtInt(p.tamamlanan));
    nc(cols.acik, nfmtInt(p.acik), true);
    nc(cols.kap, nfmtInt(p.kapasite));
    const barX = cols.dol[0], barW = 2.15, barH = 0.16, barY = cy - barH / 2;
    s.addShape(pptx.ShapeType.roundRect, { x: barX, y: barY, w: barW, h: barH, rectRadius: 0.08, fill: { color: "E5E7EB" }, line: { type: "none" } });
    s.addShape(pptx.ShapeType.roundRect, { x: barX, y: barY, w: Math.max(0.05, Math.min(1, Number(p.doluluk)) * barW), h: barH, rectRadius: 0.08, fill: { color: barColor(p.doluluk) }, line: { type: "none" } });
    s.addText("%" + Math.round(p.doluluk * 100), { x: barX + barW + 0.08, y, w: 0.7, h: rowH, fontFace: "Calibri", fontSize: 10, bold: true, color: INK, align: "left", valign: "middle", margin: 0 });
    s.addShape(pptx.ShapeType.roundRect, { x: cols.durum[0] + 0.1, y: cy - 0.16, w: cols.durum[1] - 0.2, h: 0.32, rectRadius: 0.16, fill: { color: ps.bg }, line: { color: ps.fg, width: 0.75 } });
    s.addText(ps.label, { x: cols.durum[0] + 0.1, y: cy - 0.16, w: cols.durum[1] - 0.2, h: 0.32, fontFace: "Calibri", fontSize: 9, bold: true, color: ps.fg, align: "center", valign: "middle", margin: 0 });
    if (i < persons.length - 1) s.addShape(pptx.ShapeType.line, { x: 0.4, y: y + rowH, w: 12.53, h: 0, line: { color: "F1F3F5", width: 0.75 } });
  });

  s.addText((dd.team || "") + " Kapasite Dashboard", { x: 8.5, y: 7.16, w: 4.4, h: 0.28, fontFace: "Calibri", fontSize: 8, color: "9AA3AF", align: "right", margin: 0 });
  return s;
}
