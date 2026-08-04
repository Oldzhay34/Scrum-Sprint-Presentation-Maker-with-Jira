import PptxGenJS from "pptxgenjs";
import { addCoverSlide, addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";

/**
 * Kapak + icerik slayti + kapasite dashboard'unu TEK bir PPTX icinde uretir -
 * "PPTX İndir" hangi sihirbaz adimindan tetiklenirse tetiklensin ayni birlesik
 * dosya iner.
 */
export function buildFullDeck(sprintData, dashData, assets) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  addCoverSlide(pptx, sprintData, assets);
  addContentSlide(pptx, sprintData, assets);
  addDashboardSlide(pptx, dashData, assets);
  return pptx;
}
