import { SECTION_KEYS, linesOf } from "./geometry";
import { teamTypeLabel } from "./teamTypes";

/**
 * Kaydedilmis bir sunumun ham "content" JSON'undan (bkz. App.jsx handleSave/
 * PresentationDetailDto), SlideCanvas/sprintDeckBuilder'in bekledigi
 * "sprintData" seklini uretir - useSprintForm.js'teki `data` useMemo'suyla
 * BIREBIR AYNI turetme mantigi (ortak sunum ekrani, tekil sihirbazdan farkli
 * olarak kayitli icerigi hidratlar, kendi state'ini tutmaz).
 */
export function sprintDataFromContent(content) {
  const team = teamTypeLabel(content.teamType) || content.teamType || "Ekip";
  const teamShort = team.replace(/\s*Ekibi\s*$/i, "").trim();
  const sprint = content.sprint || "";
  const range = content.range || "";
  const subtitle = [teamShort, sprint ? sprint + ". Sprint" : "", range].filter(Boolean).join(" | ");
  const result = { teamName: team, subtitle, showBand: content.band?.show, targets: content.band?.bars || [] };
  const sections = content.sections || {};
  SECTION_KEYS.forEach((k) => {
    result[k] = linesOf(sections[k] || "");
  });
  return result;
}
