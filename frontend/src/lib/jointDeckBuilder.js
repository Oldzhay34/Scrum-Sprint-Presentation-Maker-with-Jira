import PptxGenJS from "pptxgenjs";
import { addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";
import { logoPositions } from "./geometry";

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
  s.addImage({ data: assets.logo_a, x: 0.55, y: 0.42, w: 1.35, h: 1.35 * (63 / 308) });
  s.addImage({ data: assets.logo_b, x: 2.15, y: 0.36, w: 1.05, h: 1.05 * (83 / 227) });
  s.addText("Ortak Sprint Sunumu", { x: 0.55, y: 1.1, w: 10, h: 0.7, fontFace: "Calibri", fontSize: 34, bold: true, color: TEAL, margin: 0 });
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 1.85, w: 2.6, h: 0, line: { color: ORANGE, width: 2.25 } });

  const rows = teamsPayload.map((t) => [t.teamName, t.sprint ? `${t.sprint}. Sprint` : "-", t.range || "-"]);
  s.addTable(
    [
      [
        { text: "Takım", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
        { text: "Sprint", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
        { text: "Tarih Aralığı", options: { bold: true, color: "FFFFFF", fill: { color: TEAL } } },
      ],
      ...rows.map((r) => r.map((c) => ({ text: c, options: { color: INK } }))),
    ],
    { x: 0.55, y: 2.2, w: 11.5, colW: [5, 2.5, 4], fontFace: "Calibri", fontSize: 14, border: { type: "solid", color: "E5E7EB", pt: 0.75 }, autoPage: false }
  );

  const logos = logoPositions({ rightEdge: 13.195, top: 7.05, height: 0.3, gap: 0.08 });
  s.addImage({ data: assets.logo_b, ...logos.b });
  s.addImage({ data: assets.logo_a, ...logos.a });
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
