import { useMemo, useState } from "react";
import { SECTION_KEYS } from "../lib/geometry";

const SAMPLE = {
  done: [
    "**Forewatt projesindeki 1 sürecin geliştirmesi tamamlandı:** Manuel Portföy İzleme Faz2",
    "**Forewatt projesindeki 1 sürecin UAT aşaması ve canlı ortama aktarımı tamamlandı:** AES-ADEY Bölge Dışı İzleme Sistemi",
    "Forewatt - Tahminleme ve Akıllı Portföy projeleri için hava durumu veri içeriği netleştirildi ve iş birimlerine iletildi.",
    "Fiyat Hesaplama Motoru projesi canlı ortama aktarıldı.",
    "Akıllı Portföy Optimizasyonu projesinin detaylandırılması tamamlandı.",
    "Ön Termin iyileştirmelerindeki CEWB tablosu maddesi ilgili SAP ekipleri ile görüşüldü, planlandı.",
    "Malatya-2 OSB verilerindeki hata giderildi ve otomatik mail sistemine entegrasyonu tamamlandı.",
    "Fırsat Skorlama çalışmasına Jeneratör İhracat ekibine yönelik haftalık otomatik mail gönderimi eklendi.",
  ],
  active: [
    "**Forewatt projesindeki 1 UAT aşamasının tamamlanması:** Manuel Portföy İzleme Faz2",
    "**Forewatt projesindeki 1 geliştirmenin tamamlanması:** Tahminleme (Bölge içi tahminleme modeli)",
    "**Forewatt projesindeki 1 analizin tamamlanması:** Uzlaştırma Raporları",
    "Akıllı Portföy Optimizasyonu projesinde veri analizinin tamamlanması.",
    "Fiyat hesaplama motoru projesinin canlıya alınması.",
    "Ön Termin arayüz iyileştirmelerindeki konuların takibi.",
  ],
  risk: [
    "Hava durumu verisinin tedarik sürecinde veya iş birimleri arasındaki koordinasyonda yaşanabilecek gecikmeler, ilgili projelerin takvimlerini olumsuz etkileyecektir.",
  ],
  pending: [
    "Forewatt Tahminleme ve Akıllı Portföy Optimizasyonu projeleri için tedarik edilmesi gereken hava durumu verileri hakkında iş biriminden geri dönüş bekleniyor.",
  ],
};

function linesOf(text) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function useSprintForm() {
  const [team, setTeam] = useState("Yapay Zeka Ekibi");
  const [teamType, setTeamType] = useState("RPA");
  const [sprint, setSprint] = useState("7");
  const [range, setRange] = useState("10 Temmuz – 24 Temmuz");
  const [sections, setSections] = useState({ done: "", active: "", risk: "", pending: "" });

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

  const fillSample = () => {
    setSections({
      done: SAMPLE.done.join("\n"),
      active: SAMPLE.active.join("\n"),
      risk: SAMPLE.risk.join("\n"),
      pending: SAMPLE.pending.join("\n"),
    });
  };

  const clearSections = () => setSections({ done: "", active: "", risk: "", pending: "" });

  return { team, setTeam, teamType, setTeamType, sprint, setSprint, range, setRange, sections, setSectionText, appendToSection, clearSections, data, counts, fillSample };
}
