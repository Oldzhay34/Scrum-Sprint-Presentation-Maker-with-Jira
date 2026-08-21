import PptxGenJS from "pptxgenjs";
import { addCoverSlide, addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";
import { DEFAULT_CORNER_MESH } from "../assets/cornerMesh";

/**
 * Bir takimin TUM kayitli sprint sunumlarini (her biri icin kapak+icerik,
 * varsa kapasite dashboard'u) sprint sirasina gore TEK bir PPTX'te
 * birlestirir - "+ Yeni Sunum" yanindaki "Tüm Sprintler PPTX İndir" (bkz.
 * kullanici bildirimi). sprints: [{ sprintData, dashData }].
 */
export function buildTeamAllSprintsDeck(sprints, assets, theme = "light", cornerMesh) {
  // Varsayilani BURADA bir kez cozup her addXSlide cagrisina ACIKCA gecirir -
  // bkz. jointDeckBuilder.buildJointDeck'teki AYNI yorum/gerekce.
  const mesh = cornerMesh || DEFAULT_CORNER_MESH;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  sprints.forEach(({ sprintData, dashData }) => {
    addCoverSlide(pptx, sprintData, assets, mesh);
    addContentSlide(pptx, sprintData, assets, theme, mesh);
    // Kapasite verisi olmayan sprintlerde de slayt eklenir (bos iskeletle,
    // bkz. addDashboardSlide) - eskiden sessizce atlaniyordu ve sunumda
    // sayfa hic gorunmuyordu.
    addDashboardSlide(pptx, dashData, assets, theme, mesh);
  });
  return pptx;
}
