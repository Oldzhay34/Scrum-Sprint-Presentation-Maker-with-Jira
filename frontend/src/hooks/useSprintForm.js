import { useEffect, useMemo, useState } from "react";
import { SECTION_KEYS, linesOf } from "../lib/geometry";
import { teamTypeLabel } from "../lib/teamTypes";

export function useSprintForm() {
  const [teamType, setTeamType] = useState("RPA");
  const [team, setTeam] = useState(() => teamTypeLabel("RPA"));
  const [sprint, setSprint] = useState("7");
  const [range, setRange] = useState("10 Temmuz – 24 Temmuz");
  const [sections, setSections] = useState({ done: "", active: "", risk: "", pending: "" });

  // Ekip adi artik ayrica elle girilmiyor - kullanici sadece Takım Tipi'ni
  // secer (bkz. CoverPage), goruntulenen isim secilen tipin etiketinden
  // otomatik turer. Excel yuklendiginde de sadece teamType degisir (bkz.
  // App.jsx/applyExcelMeta) - bu effect onu da otomatik yakalar.
  useEffect(() => {
    setTeam(teamTypeLabel(teamType));
  }, [teamType]);

  const setSectionText = (key, text) => setSections((prev) => ({ ...prev, [key]: text }));
  const appendToSection = (key, line) =>
    setSections((prev) => ({ ...prev, [key]: (prev[key].trim() ? prev[key].trim() + "\n" : "") + line }));

  const data = useMemo(() => {
    const teamShort = team.replace(/\s*Ekibi\s*$/i, "").trim();
    const subtitle = [teamShort, sprint ? sprint + ". Sprint" : "", range].filter(Boolean).join(" | ");
    const result = { teamName: team || "Yapay Zeka Ekibi", subtitle };
    SECTION_KEYS.forEach((k) => {
      result[k] = linesOf(sections[k]);
    });
    return result;
  }, [team, sprint, range, sections]);

  const counts = useMemo(() => {
    const c = {};
    SECTION_KEYS.forEach((k) => {
      c[k] = data[k].length;
    });
    return c;
  }, [data]);

  return { team, setTeam, teamType, setTeamType, sprint, setSprint, range, setRange, sections, setSectionText, appendToSection, data, counts };
}
