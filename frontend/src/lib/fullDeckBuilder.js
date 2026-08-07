import PptxGenJS from "pptxgenjs";
import { addCoverSlide, addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";
import { DEFAULT_CORNER_MESH } from "../assets/cornerMesh";

/**
 * Kapak + icerik slayti + kapasite dashboard'unu TEK bir PPTX icinde uretir -
 * "PPTX İndir" hangi sihirbaz adimindan tetiklenirse tetiklensin ayni birlesik
 * dosya iner. cornerMesh: PPTX indirme popup'inda kullanici kendi sablon
 * gorselini yuklerse buraya gelir (bkz. PptxTemplateModal) - verilmezse
 * varsayilan (Resim1) temasi kullanilir.
 */
export function buildFullDeck(sprintData, dashData, assets, theme = "light", cornerMesh) {
  // Varsayilani BURADA bir kez cozup her addXSlide cagrisina ACIKCA gecirir -
  // bkz. jointDeckBuilder.buildJointDeck'teki AYNI yorum/gerekce.
  const mesh = cornerMesh || DEFAULT_CORNER_MESH;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  // Kapak slayti tema secimine bakmaksizin her zaman ayni (acik) kalir -
  // markali kapak gorseli zaten kendi sabit renk dilini tasiyor.
  addCoverSlide(pptx, sprintData, assets, mesh);
  addContentSlide(pptx, sprintData, assets, theme, mesh);
  addDashboardSlide(pptx, dashData, assets, theme, mesh);
  return pptx;
}
