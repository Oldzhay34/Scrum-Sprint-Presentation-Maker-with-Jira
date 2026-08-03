import { useMemo, useState } from "react";
import { parseDashboardExcel } from "../lib/excelParsers";
import { num, autoRange } from "../lib/format";

const DEFAULT_META = { team: "", dateRange: "01 Haziran – 31 Aralık 2026", reportDate: "", reportObj: null };

/**
 * Kapasite Dashboard modunun tum durumunu (Excel'den okunan veri + kullanicinin
 * duzenledigi kisi/rol/tamamlanan + son 2 hafta delta alanlari) yonetir ve
 * dashSlideHTML'in JSX karsiligi icin gereken `dashData` nesnesini uretir.
 */
export function useDashboardData(fallbackTeamName) {
  const [loaded, setLoaded] = useState(false);
  const [persons, setPersons] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [meta, setMeta] = useState(DEFAULT_META);

  const [dTeam, setDTeam] = useState("");
  const [dSprint, setDSprint] = useState("");
  const [dKapanan, setDKapanan] = useState("");
  const [dEklenen, setDEklenen] = useState("");
  const [dFte, setDFte] = useState("");
  const [dNet, setDNet] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState("Excel yükleyin — Kapasite Takip dosyasındaki Rapor sayfası okunur. Sprint modundan farklı olarak burada tüm sayılar Excel'den gelir.");

  const loadFile = (file) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseDashboardExcel(e.target.result, fallbackTeamName);
        setLoaded(true);
        setPersons(parsed.persons);
        setKpis(parsed.kpis);
        setMeta(parsed.meta);
        if (!dTeam.trim()) setDTeam(parsed.meta.team);
        setInfo(
          `Excel okundu — ${parsed.meta.team} · ${parsed.persons.length} kişi · Rapor Tarihi ${parsed.meta.reportDate}. ` +
            "Aşağıdan ad/rol ve Tamamlanan değerlerini girin (Açık = Toplam − Tamamlanan otomatik)."
        );
      } catch (err) {
        setError('Excel okunamadı: ' + (err?.message || "bilinmeyen hata") + ' — dosyanın "Rapor" sayfasını içerdiğinden emin olun.');
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

  const updatePerson = (index, patch) =>
    setPersons((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const dashData = useMemo(() => {
    const team = dTeam.trim() || meta.team || fallbackTeamName || "Ekip";
    const mappedPersons = persons.map((p) => {
      const tam = num(p.tamamlanan);
      return { name: p.name, role: p.role, initials: p.initials, toplam: p.toplam, tamamlanan: tam, acik: p.toplam - tam, kapasite: num(p.kapasite), doluluk: p.doluluk, durum: p.durum };
    });
    const k0 = kpis || { toplam: 0, doluluk: 0, durum: "" };
    const toplam = k0.toplam;
    const tamamlanan = mappedPersons.reduce((s, p) => s + p.tamamlanan, 0);
    const acik = toplam - tamamlanan;
    const kapasite = mappedPersons.reduce((s, p) => s + p.kapasite, 0);
    const kpisOut = { toplam, tamamlanan, acik, kapasite, doluluk: k0.doluluk, acikFazla: kapasite - acik, durum: k0.durum };

    let delta = null;
    if (loaded) {
      delta = {
        kapanan: dKapanan,
        eklenen: dEklenen,
        fte: dFte,
        net: dNet !== "" ? num(dNet) : -tamamlanan,
        range: autoRange(meta.reportObj),
      };
    }
    return {
      team,
      sprintNo: dSprint,
      dateRange: meta.dateRange,
      reportDate: meta.reportDate,
      kpis: loaded ? kpisOut : null,
      persons: mappedPersons,
      delta,
      deltaRange: delta ? delta.range : "",
    };
  }, [dTeam, dSprint, dKapanan, dEklenen, dFte, dNet, persons, kpis, meta, loaded, fallbackTeamName]);

  return {
    loaded, persons, loading, error, info,
    dTeam, setDTeam, dSprint, setDSprint,
    dKapanan, setDKapanan, dEklenen, setDEklenen, dFte, setDFte, dNet, setDNet,
    loadFile, updatePerson, dashData,
  };
}
