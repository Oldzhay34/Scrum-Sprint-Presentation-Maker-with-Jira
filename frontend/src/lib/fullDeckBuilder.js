import PptxGenJS from "pptxgenjs";
import { addCoverSlide, addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";

/**
 * Kapak + icerik slayti + kapasite dashboard'unu TEK bir PPTX icinde uretir -
 * "PPTX İndir" hangi sihirbaz adimindan tetiklenirse tetiklensin ayni birlesik
 * dosya iner.
 */
export function buildFullDeck(sprintData, dashData, assets, theme = "light") {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  // Kapak slayti tema secimine bakmaksizin her zaman ayni (acik) kalir -
  // markali kapak gorseli zaten kendi sabit renk dilini tasiyor.
  addCoverSlide(pptx, sprintData, assets);
  addContentSlide(pptx, sprintData, assets, theme);
  addDashboardSlide(pptx, dashData, assets, theme);
  return pptx;
}
