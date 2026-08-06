import PptxGenJS from "pptxgenjs";
import { addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";

/**
 * Ortak (coklu takim) sunumun kapak slaydini ekler - her secilen takimin
 * adini/sprint numarasini/tarih araligini tek bir listede gosterir. Icerik +
 * kapasite slaytlari her takim icin AYNEN mevcut (tekil) export'takiyle
 * birebir ayni fonksiyonlarla (addContentSlide/addDashboardSlide) uretilir -
 * kod tekrari yerine tam yeniden kullanim.
 */
function addJointCoverSlide(pptx, teamsPayload, assets) {
  const TEAL = "164E63", ORANGE = "E67514", INK = "1F2937";
  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  // Tekil takim kapak sablonuyla (bkz. sprintDeckBuilder.addCoverSlide) AYNI
  // varsayilan gorsel - tam sayfa arka plan fotograf. Tablo tam genislik
  // kullandigi icin (tekildeki dar sol panelin aksine) icerigin arkasina,
  // fotografi tamamen kapatmayan yari-saydam beyaz bir "kart" konur - boylece
  // gorsel hala gorunur kalir ama tablo okunakli olur.
  if (assets.cover_bg) s.addImage({ data: assets.cover_bg, x: 0, y: 0, w: 13.333, h: 7.5 });
  const rows = teamsPayload.map((t) => [t.teamName, t.sprint ? `${t.sprint}. Sprint` : "-", t.range || "-"]);
  // ONEMLI: pptxgenjs addTable icin rowH VERILMEZSE PowerPoint kendi
  // (ongoruemeyen, genelde bizim tahminimizden daha buyuk) satir yuksekligini
  // kullanir - kart yuksekligi (cardH) sabit bir varsayima gore onceden
  // hesaplandigi icin bu, tablo kartin tabanindan tasip "kaymis" gorunmesine
  // yol aciyordu (bkz. kullanici bildirimi). rowH'i SABIT/bilinen tutup cardH'i
  // buna gore hesaplayarak ikisi HER ZAMAN birbiriyle uyumlu kalir.
  const TABLE_Y = 1.95;
  const ROW_H = 0.4;
  const tableH = (rows.length + 1) * ROW_H;
  const cardH = TABLE_Y - 0.3 + tableH + 0.3;
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.35, y: 0.3, w: 12.63, h: cardH, rectRadius: 0.08,
    fill: { color: "FFFFFF", transparency: 12 }, line: { type: "none" },
    shadow: { type: "outer", color: "1F2937", blur: 10, offset: 3, angle: 90, opacity: 0.22 },
  });
  s.addImage({ data: assets.logo_a, x: 0.65, y: 0.5, w: 1.35, h: 1.35 * (63 / 308) });
  s.addImage({ data: assets.logo_b, x: 2.25, y: 0.44, w: 1.05, h: 1.05 * (83 / 227) });
  s.addText("Ortak Sprint Sunumu", { x: 0.65, y: 1.15, w: 10, h: 0.6, fontFace: "Calibri", fontSize: 30, bold: true, color: TEAL, margin: 0 });
  s.addShape(pptx.ShapeType.line, { x: 0.68, y: 1.78, w: 2.6, h: 0, line: { color: ORANGE, width: 2.25 } });

  s.addTable(
    [
      [
        { text: "Takım", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
        { text: "Sprint", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
        { text: "Tarih Aralığı", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
      ],
      ...rows.map((r) => r.map((c) => ({ text: c, options: { color: INK } }))),
    ],
    {
      x: 0.65, y: TABLE_Y, w: 12.03, colW: [5.2, 2.63, 4.2], rowH: ROW_H,
      fontFace: "Calibri", fontSize: 14, valign: "middle",
      border: { type: "solid", color: "E5E7EB", pt: 0.75 }, autoPage: false,
    }
  );

  return s;
}

/**
 * Secilen tum takimlarin sunumlarini TEK bir pptx'te birlestirir: bir kapak
 * (tum takim adi/sprint/tarih listesi) + her takim icin kendi icerik ve
 * kapasite slaytlari. teamsPayload: [{ teamId, teamName, sprint, range,
 * sprintData, dashData }].
 */
export function buildJointDeck(teamsPayload, assets, theme = "light") {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  addJointCoverSlide(pptx, teamsPayload, assets);
  teamsPayload.forEach((t) => {
    addContentSlide(pptx, t.sprintData, assets, theme);
    if (t.dashData && t.dashData.kpis) addDashboardSlide(pptx, t.dashData, assets, theme);
  });
  return pptx;
}
