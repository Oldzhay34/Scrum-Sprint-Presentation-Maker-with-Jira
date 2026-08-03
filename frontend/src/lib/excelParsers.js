import * as XLSX from "xlsx";
import { trDDMM, xd } from "./format";

export const STATUS_MAP = {
  Canlı: "done", "Canlıda/Y": "done", UAT: "done",
  Geliştirme: "active", Analiz: "active", "Devam Ediyor": "active", "Analiz Onayı": "active", "Ön Analiz": "active",
  Backlog: "pending", Beklemede: "pending", "Müşteri Bekleniyor": "pending", "Analiz Havuzu": "pending", "Geliştirme Havuzu": "pending",
};

/**
 * Sprint modu: "İş_Listesi" sayfasindaki is kalemlerini statulerine gore
 * bolum onerisi (chip) listesine cevirir. Dosya okunamazsa hata firlatir -
 * cagiran taraf bunu kullaniciya normalize ederek gostermelidir.
 */
export function parseSprintExcel(arrayBuffer) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const suggestions = { done: [], active: [], risk: [], pending: [] };
  let itemCount = 0;
  let reportDateHint = "";

  if (wb.Sheets["İş_Listesi"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["İş_Listesi"], { defval: "" });
    rows.forEach((row) => {
      const name = (row["İş Adı"] || "").toString().trim();
      const st = (row["Statü"] || "").toString().trim();
      if (!name) return;
      itemCount++;
      const sec = STATUS_MAP[st];
      if (sec) suggestions[sec].push(name);
    });
  }
  if (wb.Sheets["Parametreler"]) {
    const p = wb.Sheets["Parametreler"];
    reportDateHint = p["B4"] && p["B4"].w ? p["B4"].w : p["B4"] ? p["B4"].v : "";
  }
  return { suggestions, itemCount, reportDateHint };
}

/**
 * Dashboard modu: "Rapor" (+ opsiyonel "Kapasite") sayfasindan kapasite
 * gostergelerini ve kisi listesini cikarir. Beklenen sayfa/etiket
 * bulunamazsa hata firlatir.
 */
export function parseDashboardExcel(arrayBuffer, fallbackTeamName) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  if (!wb.Sheets["Rapor"]) throw new Error('"Rapor" sayfası bulunamadı');

  const A = XLSX.utils.sheet_to_json(wb.Sheets["Rapor"], { header: 1, defval: null });
  const findRow = (pred) => A.find((row) => row && pred((row[0] || "").toString()));
  const val = (label, col) => {
    const row = findRow((s) => s.includes(label));
    return row ? row[col] : null;
  };
  const start = val("Başlangıç", 1), rapor = val("Rapor Tarihi", 1);
  const hIdx = A.findIndex((row) => row && (row[0] || "").toString().trim() === "Gösterge");
  const header = hIdx >= 0 ? A[hIdx] : [];
  const pcols = [];
  for (let c = 2; c < header.length; c++) {
    if (header[c] != null && String(header[c]).trim() !== "") pcols.push({ c, name: String(header[c]).trim() });
    else break;
  }
  const mrow = (sub) => {
    for (let i = hIdx + 1; i < A.length; i++) {
      const row = A[i];
      if (row && (row[0] || "").toString().includes(sub)) return row;
    }
    return null;
  };
  const rT = mrow("Toplam Planlanan Efor"), rDone = mrow("Tamamlanan"), rDol = mrow("Kalan Kapasite Bakımlı"), rDur = mrow("Durum");
  const g = (row, c) => (row ? Number(row[c]) : 0);
  const total = { toplam: g(rT, 1), doluluk: g(rDol, 1), durum: rDur ? String(rDur[1]) : "" };

  const kapMap = {};
  if (wb.Sheets["Kapasite"]) {
    const K = XLSX.utils.sheet_to_json(wb.Sheets["Kapasite"], { header: 1, defval: null });
    const kh = (K[0] || []).map((x) => (x == null ? "" : String(x)));
    const nameCol = kh.findIndex((x) => x.includes("Kişi"));
    const kalanCol = kh.findIndex((x) => x.trim() === "Kalan İş Günü");
    if (nameCol >= 0 && kalanCol >= 0) {
      for (let i = 1; i < K.length; i++) {
        const row = K[i];
        if (row && row[nameCol] != null && String(row[nameCol]).trim() !== "") {
          kapMap[String(row[nameCol]).trim()] = Number(row[kalanCol]) || 0;
        }
      }
    }
  }

  const persons = pcols.map((p) => ({
    name: p.name,
    role: "",
    initials: p.name.slice(0, 2).toUpperCase(),
    toplam: g(rT, p.c),
    tamamlanan: Math.round(g(rDone, p.c)),
    kapasite: kapMap[p.name] != null ? kapMap[p.name] : 0,
    doluluk: g(rDol, p.c),
    durum: rDur ? String(rDur[p.c]) : "",
  }));

  const a1 = A[0] && A[0][0] ? String(A[0][0]) : "";
  const team = a1.replace(/Kapasite.*$/i, "").trim() || fallbackTeamName || "Ekip";

  return {
    persons,
    kpis: total,
    meta: { team, dateRange: "01 Haziran – 31 Aralık 2026", reportDate: trDDMM(rapor), reportObj: xd(rapor) },
  };
}
