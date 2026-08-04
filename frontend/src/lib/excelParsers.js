import * as XLSX from "xlsx";
import { trDDMM, xd } from "./format";
import { PRIORITY_ORDER } from "./geometry";

/**
 * Excel'deki "Statü" degerlerinin hangi sprint bolumune (done/active/risk/pending)
 * karsilik geldigi, TAKIMA GORE degisir - her ekibin kendi Excel sablonu/statu
 * listesi olabilir. RPA Ekibi'nin su anki gercek statu listesiyle birebir aynidir
 * (bkz. ekiple paylasilan "Parametreler" sayfasindaki Statü dropdown'u).
 * Diger ekiplerin (İş Zekası, Ürün Geliştirme) Excel sablonlari henuz gelmedi -
 * onlar icin de simdilik ayni harita varsayilan olarak kullanilir; gercek
 * sablonlari gelince DEFAULT_STATUS_MAP yerine kendi girdileri eklenmeli.
 */
const RPA_STATUS_MAP = {
  Canlı: "done", "Canlıda/Y": "done", UAT: "done",
  Geliştirme: "active", Analiz: "active", "Devam Ediyor": "active", "Analiz Onayı": "active", "Ön Analiz": "active",
  Backlog: "pending", Beklemede: "pending", "Müşteri Bekleniyor": "pending", "Analiz Havuzu": "pending", "Geliştirme Havuzu": "pending",
};

const DEFAULT_STATUS_MAP = RPA_STATUS_MAP;

export const STATUS_MAP_BY_TEAM = {
  "RPA Ekibi": RPA_STATUS_MAP,
  "İş Zekası Ekibi": DEFAULT_STATUS_MAP,
  "Ürün Geliştirme Ekibi": DEFAULT_STATUS_MAP,
};

/** Geriye uyumluluk icin: eskiden tek/global harita olarak disari aciliyordu. */
export const STATUS_MAP = RPA_STATUS_MAP;

/** Excel'in "Parametreler" sayfasindaki Öncelik dropdown'uyla birebir aynidir - manuel giriste select icin kullanilir. */
export const PRIORITY_OPTIONS = PRIORITY_ORDER;

/** Excel'in "Parametreler" sayfasindaki Sektör dropdown'uyla birebir aynidir - manuel giriste select icin kullanilir. */
export const SECTOR_OPTIONS = ["EPSAS", "Doğalgaz", "Holding", "Jeneratör", "FEDAŞ", "CEDAŞ", "Enerji", "Hospitality"];

function statusMapFor(teamName) {
  return STATUS_MAP_BY_TEAM[(teamName || "").trim()] || DEFAULT_STATUS_MAP;
}

/**
 * "İş Adı" yanina Sektör/Departman kalin bir etiket olarak ("**EPSAS · Muhasebe**"),
 * Öncelik ise renkli+kalin ayrı bir isaretleyici olarak ("##Kritik##") eklenir -
 * ikisi de parseRuns (lib/geometry.js) tarafindan cozumlenip slaytta/PPTX'te
 * gosterilir (bkz. PRIORITY_COLORS).
 */
function formatWorkItemName(name, sector, department, priority) {
  const plainTags = [sector, department].map((t) => (t == null ? "" : String(t).trim())).filter(Boolean);
  const p = priority == null ? "" : String(priority).trim();
  let suffix = "";
  if (plainTags.length) suffix += ` — **${plainTags.join(" · ")}**`;
  if (p) suffix += (suffix ? " " : " — ") + `##${p}##`;
  return suffix ? `${name}${suffix}` : name;
}

/** "Rapor" sayfasinda ilk sutunu tam olarak "label" olan satirin B sutunundaki (index 1) degerini doner. */
function findLabeledValue(rows, label) {
  const row = rows.find((r) => r && (r[0] || "").toString().trim() === label);
  return row && row[1] != null ? Number(row[1]) : null;
}

/**
 * "Rapor" sayfasindaki "FTE Gerçekleşen/Kalan" ve "Canlı/Kalan Süreç Sayısı"
 * satirlarindan Hedefler bandinin iki cubugunu (HEDEFLER, FTE) uretir - bandin
 * kendisi manuel/ornek degil, dogrudan Excel'den gelen gercek verilerdir.
 * Gerekli satirlar bulunamazsa (baska bir ekibin sablonu farkli olabilir) ilgili
 * cubuk/tum liste atlanir, hata firlatilmaz.
 */
function parseBandTargets(wb) {
  if (!wb.Sheets["Rapor"]) return [];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["Rapor"], { header: 1, defval: null });
  const bars = [];

  const canliSurec = findLabeledValue(rows, "Canlı Süreç Sayısı");
  const kalanSurec = findLabeledValue(rows, "Kalan Süreç Sayısı");
  if (canliSurec != null && kalanSurec != null) {
    bars.push({
      label: "HEDEFLER",
      segments: [
        { value: String(canliSurec), color: "green" },
        { value: String(kalanSurec), color: "blue" },
      ],
    });
  }

  const fteGerceklesen = findLabeledValue(rows, "FTE Gerçekleşen");
  const fteKalan = findLabeledValue(rows, "FTE Kalan");
  if (fteGerceklesen != null && fteKalan != null) {
    bars.push({
      label: "FTE",
      segments: [
        { value: fteGerceklesen.toFixed(2), color: "green" },
        { value: fteKalan.toFixed(2), color: "blue" },
      ],
    });
  }

  return bars;
}

/**
 * Sprint modu: "İş_Listesi" sayfasindaki is kalemlerini statulerine gore
 * bolum onerisi (chip) listesine cevirir, "Rapor" sayfasindan da Hedefler
 * bandini (bkz. parseBandTargets) cikarir. teamName verilirse o ekibin statu
 * haritasi kullanilir (bkz. STATUS_MAP_BY_TEAM), yoksa varsayilan harita.
 * Dosya okunamazsa hata firlatir - cagiran taraf bunu kullaniciya normalize
 * ederek gostermelidir.
 */
export function parseSprintExcel(arrayBuffer, teamName) {
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const suggestions = { done: [], active: [], risk: [], pending: [] };
  const statusMap = statusMapFor(teamName);
  let itemCount = 0;
  let reportDateHint = "";

  if (wb.Sheets["İş_Listesi"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["İş_Listesi"], { defval: "" });
    rows.forEach((row) => {
      const name = (row["İş Adı"] || "").toString().trim();
      const st = (row["Statü"] || "").toString().trim();
      if (!name) return;
      itemCount++;
      const sec = statusMap[st];
      if (sec) {
        const sector = row["Sektör"];
        const department = row["Departman"];
        const priority = row["Öncelik"];
        suggestions[sec].push(formatWorkItemName(name, sector, department, priority));
      }
    });
  }
  if (wb.Sheets["Parametreler"]) {
    const p = wb.Sheets["Parametreler"];
    reportDateHint = p["B4"] && p["B4"].w ? p["B4"].w : p["B4"] ? p["B4"].v : "";
  }
  const bandTargets = parseBandTargets(wb);
  return { suggestions, itemCount, reportDateHint, bandTargets };
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

  // "İş_Listesi" sayfasindaki "FTE" sutunu su an baska hicbir yerde
  // kullanilmiyor - toplamini Kapasite Dashboard'da ek bir kart olarak
  // gostermek icin burada topluyoruz (bkz. useDashboardData.js).
  let totalFte = null;
  if (wb.Sheets["İş_Listesi"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["İş_Listesi"], { defval: "" });
    if (rows.some((row) => row["FTE"] !== "" && row["FTE"] != null)) {
      totalFte = rows.reduce((sum, row) => sum + (Number(row["FTE"]) || 0), 0);
    }
  }

  return {
    persons,
    kpis: total,
    totalFte,
    meta: { team, dateRange: "01 Haziran – 31 Aralık 2026", reportDate: trDDMM(rapor), reportObj: xd(rapor) },
  };
}
