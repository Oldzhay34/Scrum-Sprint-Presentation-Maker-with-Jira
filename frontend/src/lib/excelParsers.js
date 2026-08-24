import * as XLSX from "xlsx";
import { trDDMM, xd, autoRange, initialsOf } from "./format";
import { PRIORITY_ORDER } from "./geometry";
import { makeSuggestion } from "./suggestions";

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
  "Yapay Zeka Ekibi": DEFAULT_STATUS_MAP,
  "Dijital Uygulamalar Ekibi": DEFAULT_STATUS_MAP,
  "Konum Tabanlı Ürün Geliştirme Ekibi": DEFAULT_STATUS_MAP,
  "Doküman ve Süreç Yönetim Sistemi Ekibi": DEFAULT_STATUS_MAP,
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
export function formatWorkItemName(name, sector, department, priority) {
  const plainTags = [sector, department].map((t) => (t == null ? "" : String(t).trim())).filter(Boolean);
  const p = priority == null ? "" : String(priority).trim();
  let suffix = "";
  if (plainTags.length) suffix += ` — **${plainTags.join(" · ")}**`;
  if (p) suffix += (suffix ? " " : " — ") + `##${p}##`;
  return suffix ? `${name}${suffix}` : name;
}

/**
 * "Parametreler" sayfasindaki "Takım Adı" hucresinden (varsa) veya İş_Listesi/
 * Rapor sayfalarindaki FTE izlerinden (RPA'ya ozgu) takim tipini tahmin eder.
 * Kapak sayfasindaki "Takım tipi" secimini Excel yuklendiginde otomatik
 * senkron tutmak icin kullanilir - bulunamazsa null doner (secim degismez).
 */
function detectTeamType(wb) {
  const p = wb.Sheets["Parametreler"];
  if (p && p["B11"]) {
    // Turkce noktali/noktasiz "İ/I" harfleri varsayilan (Turkce olmayan) toLowerCase
    // ile yanlis kucultulur (orn. "İş" -> "i̇ş", "ş zekas" ile eslesmez) - bu yuzden
    // Turkce locale ile kucultulur.
    const name = String(p["B11"].w || p["B11"].v || "").trim().toLocaleLowerCase("tr");
    if (name.includes("rpa")) return "RPA";
    if (name.includes("yapay")) return "YAPAY_ZEKA";
    if (name.includes("zeka")) return "IS_ZEKASI";
    if (name.includes("konum")) return "KONUM_TABANLI_URUN_GELISTIRME";
    if (name.includes("ürün") || name.includes("urun")) return "URUN_GELISTIRME";
    if (name.includes("dijital")) return "DIJITAL_UYGULAMALAR";
    if (name.includes("doküman") || name.includes("dokuman") || name.includes("dsys")) return "DSYS";
  }
  if (wb.Sheets["İş_Listesi"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["İş_Listesi"], { defval: "" });
    if (rows.some((r) => r["FTE"] !== "" && r["FTE"] != null)) return "RPA";
  }
  if (wb.Sheets["Rapor"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Rapor"], { header: 1, defval: null });
    if (rows.some((r) => r && (r[0] || "").toString().trim() === "FTE Hedef")) return "RPA";
  }
  return null;
}

/**
 * "Parametreler" sayfasindaki Rapor Tarihi ve Sprint No hucrelerinden Kapak
 * sayfasinin "Tarih aralığı" (son 2 haftalik sprint penceresi, bkz. autoRange)
 * ve "Sprint no" alanlarini turetir. Hucreler bos/eksikse ilgili alan null
 * doner - cagiran taraf mevcut degeri degistirmez.
 */
function parametrelerHints(wb) {
  const p = wb.Sheets["Parametreler"];
  if (!p) return { sprintNo: null, range: null };
  const reportSerial = p["B4"] ? p["B4"].v : null;
  const sprintNoRaw = p["B12"] ? p["B12"].v : null;
  const sprintNo = sprintNoRaw != null && String(sprintNoRaw).trim() !== "" ? String(sprintNoRaw).trim() : null;
  const range = reportSerial ? autoRange(xd(reportSerial)) : null;
  return { sprintNo, range };
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
        // Oneriler artik duz string degil, siralanabilir birer NESNE - bkz.
        // lib/suggestions.js ve SuggestionList.jsx ("çok demode ve rastgele
        // gözüküyor ... bir liste gibi", PO notu 2026-08-19). Excel'de
        // ekleniş tarihi sutunu varsa siralamada kullanilir.
        const addedRaw = row["Eklenme Tarihi"] ?? row["Açılış Tarihi"] ?? row["Tarih"] ?? null;
        const added = addedRaw ? xd(addedRaw) : null;
        suggestions[sec].push(
          makeSuggestion(formatWorkItemName(name, sector, department, priority), {
            priority: priority ? String(priority).trim() : null,
            sector: sector ? String(sector).trim() : null,
            addedDate: added ? added.toISOString().slice(0, 10) : null,
            source: "excel",
          })
        );
      }
    });
  }
  if (wb.Sheets["Parametreler"]) {
    const p = wb.Sheets["Parametreler"];
    reportDateHint = p["B4"] && p["B4"].w ? p["B4"].w : p["B4"] ? p["B4"].v : "";
  }
  const bandTargets = parseBandTargets(wb);
  const teamType = detectTeamType(wb);
  const { sprintNo, range } = parametrelerHints(wb);
  return { suggestions, itemCount, reportDateHint, bandTargets, teamType, sprintNo, range };
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
  // "Kapasite Farkı" artik Excel'in KENDISINDE hazir bir alan (Rapor!B32 =
  // "Bakım Hariç Kalan Kapasite" − "Kalan Efor"); PO'lar bu alani sablona
  // eklemeyi kabul etti (kullanici bildirimi 2026-08-20). Varsa DOGRUDAN
  // okunur - boylece uygulamanin turettigi deger ile PO'nun Excel'de gordugu
  // rakam arasinda hicbir sapma olmaz. Etiket sonunda iki nokta var
  // ("Kapasite Farkı:"), bu yuzden includes ile aranir. Alan yoksa
  // (eski sablonlar) null doner ve cagiran taraf eskisi gibi kendisi hesaplar.
  const rGap = findRow((s) => s.trim().startsWith("Kapasite Farkı"));
  const kapasiteFarki = rGap && rGap[1] != null && String(rGap[1]).trim() !== "" ? Number(rGap[1]) : null;
  const total = {
    toplam: g(rT, 1),
    doluluk: g(rDol, 1),
    durum: rDur ? String(rDur[1]) : "",
    kapasiteFarki: Number.isFinite(kapasiteFarki) ? kapasiteFarki : null,
  };

  const kapMap = {};
  const bakimliKapMap = {};
  const roleMap = {};
  if (wb.Sheets["Kapasite"]) {
    const K = XLSX.utils.sheet_to_json(wb.Sheets["Kapasite"], { header: 1, defval: null });
    const kh = (K[0] || []).map((x) => (x == null ? "" : String(x)));
    const nameCol = kh.findIndex((x) => x.includes("Kişi"));
    // "Kapasite" gostergesi HERHANGI BIR HESAPLAMA YAPILMADAN dogrudan "Kalan
    // İş Günü" kolonundan okunur - bakim/SR orani ONCEDEN burada (frontend'de)
    // dusuluyordu ("Bakım Hariç Kalan Kapasite" kolonu okunuyordu), bu da
    // kullaniciya once ham degeri (orn. 59,5) sonra bakim-dusulmus degeri
    // (orn. 50,20) gosteriyormus gibi kafa karistirici bir fark yaratiyordu
    // (kullanici bildirimi 2026-08-24: "kapasite verisi herhangi bir
    // hesaplama yapılmadan kalan iş gününden çekilecek"). "Bakım Hariç Kalan
    // Kapasite" kolonu ARTIK SADECE Kapasite Farkı hesabinda (bkz.
    // DashboardEditModal computeKpisFromPersons / useDashboardData acikFazla)
    // ayri bir alan (bakimliKapasite) olarak kullanilir, goruntulenen
    // "Kapasite" degerini ETKİLEMEZ.
    const kalanCol = kh.findIndex((x) => x.trim() === "Kalan İş Günü");
    const bakimliCol = kh.findIndex((x) => x.trim() === "Bakım Hariç Kalan Kapasite");
    const roleCol = kh.findIndex((x) => x.trim() === "Rol");
    if (nameCol >= 0 && (kalanCol >= 0 || bakimliCol >= 0)) {
      for (let i = 1; i < K.length; i++) {
        const row = K[i];
        if (row && row[nameCol] != null && String(row[nameCol]).trim() !== "") {
          const name = String(row[nameCol]).trim();
          kapMap[name] = kalanCol >= 0 ? Number(row[kalanCol]) || 0 : Number(row[bakimliCol]) || 0;
          if (bakimliCol >= 0) bakimliKapMap[name] = Number(row[bakimliCol]) || 0;
          if (roleCol >= 0 && row[roleCol] != null && String(row[roleCol]).trim() !== "") {
            roleMap[name] = String(row[roleCol]).trim();
          }
        }
      }
    }
  }

  const persons = pcols.map((p) => ({
    name: p.name,
    role: roleMap[p.name] || "",
    initials: initialsOf(p.name),
    toplam: g(rT, p.c),
    tamamlanan: Math.round(g(rDone, p.c)),
    kapasite: kapMap[p.name] != null ? kapMap[p.name] : 0,
    bakimliKapasite: bakimliKapMap[p.name] != null ? bakimliKapMap[p.name] : null,
    doluluk: g(rDol, p.c),
    durum: rDur ? String(rDur[p.c]) : "",
  }));

  const a1 = A[0] && A[0][0] ? String(A[0][0]) : "";
  const team = a1.replace(/Kapasite.*$/i, "").trim() || fallbackTeamName || "Ekip";

  // "İş_Listesi" sayfasindaki "FTE" sutunu (RPA'ya ozgu, sadece RPA Excel'lerinde
  // var) - toplamini Kapasite Dashboard'da "Toplam FTE" ek karti olarak gostermek
  // icin burada topluyoruz (bkz. useDashboardData.js). Baska takim tipinin
  // Excel'inde bu sayfa/sutun olmadigindan totalFte otomatik null kalir.
  //
  // ESKIDEN butun satirlarin FTE'si (statu ne olursa olsun - Açık/Devam Ediyor
  // dahil) toplaniyordu; bu, Excel'in KENDI "Rapor" sayfasindaki "FTE
  // Gerçekleşen" hucresinden (B12) FARKLI bir sayi uretiyordu - dosya
  // incelemesi 2026-08-20'de o hucrenin gercek formulu bulundu:
  //   =SUMIFS(FTE,Statü,"Canlı") + SUMIFS(FTE,Statü,"Canlıda/Y") + SUMIFS(FTE,Statü,"İptal")
  // yani SADECE fiilen tamamlanmis/canliya alinmis/iptal edilmis isler
  // sayilir - hala acik/devam eden backlog'un FTE'si "gerceklesen"e HENUZ
  // girmez (kullanici bildirimi 2026-08-20: "fte oranı yanlışmış"). Ayni
  // formul burada birebir tekrarlanir ki uygulamadaki "Toplam FTE" karti
  // Excel'deki "FTE Gerçekleşen" ile HER ZAMAN ayni sayiyi gostersin.
  const FTE_REALIZED_STATUSES = new Set(["Canlı", "Canlıda/Y", "İptal"]);
  let totalFte = null;
  if (wb.Sheets["İş_Listesi"]) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["İş_Listesi"], { defval: "" });
    if (rows.some((row) => row["FTE"] !== "" && row["FTE"] != null)) {
      totalFte = rows
        .filter((row) => FTE_REALIZED_STATUSES.has(String(row["Statü"] ?? "").trim()))
        .reduce((sum, row) => sum + (Number(row["FTE"]) || 0), 0);
    }
  }

  const teamType = detectTeamType(wb);
  const { sprintNo, range } = parametrelerHints(wb);

  return {
    persons,
    kpis: total,
    totalFte,
    teamType,
    sprintNo,
    range,
    meta: { team, dateRange: "01 Haziran – 31 Aralık 2026", reportDate: trDDMM(rapor), reportObj: xd(rapor) },
  };
}
