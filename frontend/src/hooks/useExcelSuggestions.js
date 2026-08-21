import { useState } from "react";
import { parseSprintExcel } from "../lib/excelParsers";

/**
 * Excel'den okunan is kalemlerini bolum bazli oneri (chip) listelerine cevirir.
 * Pressman - Error Information Handling: parse hatasi kullaniciya normalize
 * edilmis, ne yapmasi gerektigini soyleyen bir mesajla gosterilir.
 */
export function useExcelSuggestions() {
  const [suggestions, setSuggestions] = useState({ done: [], active: [], risk: [], pending: [] });
  const [bandTargets, setBandTargets] = useState([]);
  const [info, setInfo] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadFile = (file, teamName, onParsed) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { suggestions: parsed, itemCount, reportDateHint, bandTargets: bars, teamType, sprintNo, range } = parseSprintExcel(e.target.result, teamName);
        setSuggestions(parsed);
        setBandTargets(bars);
        const parts = [itemCount + " iş kalemi"];
        if (reportDateHint) parts.push("Rapor tarihi: " + reportDateHint);
        setInfo("Excel okundu — " + parts.join(" · ") + ". Öneriler bölümlerin altında.");
        onParsed?.({ teamType, sprintNo, range });
      } catch (err) {
        setError("Excel okunamadı: " + (err?.message || "bilinmeyen hata") + " — dosyanın \"İş_Listesi\" sayfasını içerdiğinden emin olun.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Dosya okunamadı. Lütfen tekrar deneyin.");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const removeSuggestion = (section, text) => {
    setSuggestions((prev) => ({ ...prev, [section]: prev[section].filter((s) => s.text !== text) }));
  };

  const clear = () => setSuggestions({ done: [], active: [], risk: [], pending: [] });

  return { suggestions, bandTargets, info, error, loading, loadFile, removeSuggestion, clear };
}
