// Tarih/sayi bicimlendirme ve durum-renk esleme yardimcilari.
// Orijinal Sprint_Sunum_Uretici.html'deki mantikla birebir aynidir.

export const TR_MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function xd(v) {
  if (v == null || v === "") return null;
  let d;
  if (typeof v === "number") d = new Date(Math.round((v - 25569) * 86400000));
  else if (v instanceof Date) d = v;
  else d = new Date(v);
  return isNaN(d) ? null : d;
}

export function trDate(v) {
  const d = xd(v);
  if (!d) return "";
  return d.getUTCDate() + " " + TR_MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

export function trDDMM(v) {
  const d = xd(v);
  if (!d) return "";
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getUTCDate()) + "." + p(d.getUTCMonth() + 1) + "." + d.getUTCFullYear();
}

export function nfmtInt(n) {
  return Math.round(Number(n)).toLocaleString("tr-TR");
}

export function nfmt1(n) {
  const v = Number(n);
  return (Math.round(v * 10) / 10).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function npct(r) {
  return "%" + Math.round(Number(r) * 100);
}

const STATUS_STYLE_MAP = {
  "Yüksek Risk": { fg: "B91C1C", bg: "FEE2E2", bar: "DC2626", border: "FCA5A5" },
  Risk: { fg: "C2410C", bg: "FFEDD5", bar: "EA580C", border: "FDBA74" },
  Dikkat: { fg: "B45309", bg: "FEF3C7", bar: "D97706", border: "FCD34D" },
  Uygun: { fg: "15803D", bg: "DCFCE7", bar: "16A34A", border: "86EFAC" },
};

/**
 * "Ekip Özet" KPI kartlari icin ton paleti - hex degerleri "#" ONEKI OLMADAN
 * (STATUS_STYLE_MAP ile ayni konvansiyon, cagiran taraf ekliyor).
 */
export const CARD_TONES = {
  risk: { bg: "FEE2E2", fg: "B91C1C", border: "FCA5A5" },
  warn: { bg: "FEF3C7", fg: "B45309", border: "FCD34D" },
  good: { bg: "DCFCE7", fg: "15803D", border: "86EFAC" },
  info: { bg: "DBEAFE", fg: "1D4ED8", border: "93C5FD" },
};

export function dStatus(durum, ratio) {
  let label = durum;
  if (typeof ratio === "number") label = ratio >= 1.2 ? "Yüksek Risk" : ratio >= 1.0 ? "Risk" : ratio >= 0.85 ? "Dikkat" : "Uygun";
  return Object.assign({ label }, STATUS_STYLE_MAP[label] || STATUS_STYLE_MAP["Uygun"]);
}

/**
 * Kapasite dashboard'unun ust "Ekip Özet" KPI kart listesini hesaplar - HER
 * ZAMAN tam 5 sabit kart (Genel Durum, Kapasite %, Kapasite Farkı, Yeni
 * Eklenen İş Yükü, Dönem Kapanan İş Yükü) - ozel KPI'lar (dd.customKpis) bu
 * satira eklenmez (bkz. kullanici bildirimi: "iki fotoda da 5 kutu olsun").
 * Canli onizleme (DashboardSlideCanvas) ve PPTX export (dashboardDeckBuilder)
 * BU fonksiyonu kullanarak "birebir ayni" kart setini/renk tonlarini uretir.
 */
export function buildSummaryCards(dd) {
  const k = dd.kpis, dur = dStatus(k.durum, k.doluluk), d = dd.delta;
  const durToneName = dur.label === "Uygun" ? "good" : dur.label === "Dikkat" ? "warn" : "risk";
  const cards = [
    { label: "Genel Durum", value: dur.label, sub: "Doluluk eşiklerine göre", toneName: durToneName, text: true },
    { label: "Kapasite", value: npct(k.doluluk), sub: "Bakım/SR sonrası %", toneName: null },
    {
      label: "Kapasite Farkı",
      value: nfmt1(k.acikFazla) + " A/G",
      sub: "Açık kapasite karşılaştırması",
      toneName: k.acikFazla < 0 ? "risk" : k.acikFazla > 0 ? "good" : null,
    },
  ];
  if (d) {
    cards.push({ label: "Yeni Eklenen İş Yükü", value: nfmtInt(d.eklenen) + " A/G", sub: "Son 2 hafta", toneName: "info" });
    // Kapanan is (yuk azaltan bir "delta") negatif gosterilir - kapatilan is
    // acik is yukunu AZALTIR, bu yuzden isaret negatif olmali - kart etiketi
    // de bu yuzden "Net İş Yükü Değişimi" (bkz. kullanici bildirimi).
    cards.push({ label: "Net İş Yükü Değişimi", value: nfmtInt(-Number(d.kapanan)) + " A/G", sub: "Son 2 hafta", toneName: "good" });
  }
  return cards;
}

/** Kisi tablosundaki tamamlanan/acik/kapasite kolonlarinin "EKİP TOPLAMI" satiri icin toplamlarini hesaplar. */
export function personTotals(persons) {
  return (persons || []).reduce(
    (a, p) => ({
      tamamlanan: a.tamamlanan + Number(p.tamamlanan || 0),
      acik: a.acik + Number(p.acik || 0),
      kapasite: a.kapasite + Number(p.kapasite || 0),
    }),
    { tamamlanan: 0, acik: 0, kapasite: 0 }
  );
}

/** Backend'in RiskLevel enum'unu (UYGUN/DIKKAT/RISK/YUKSEK_RISK) Turkce etikete cevirir. */
export function riskLevelToLabel(riskLevel) {
  switch (riskLevel) {
    case "YUKSEK_RISK":
      return "Yüksek Risk";
    case "RISK":
      return "Risk";
    case "DIKKAT":
      return "Dikkat";
    default:
      return "Uygun";
  }
}

export const DAV_COLORS = ["2563EB", "16A34A", "EA580C", "7C3AED", "0891B2", "DB2777", "CA8A04", "4F46E5"];

export function barColor(r) {
  r = Number(r);
  return r >= 1 ? "DC2626" : r >= 0.8 ? "EA580C" : "16A34A";
}

export function num(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
}

/**
 * Sayisal input alanlarinda yazarken gecersiz karakterleri (harf, sembol vb.)
 * aninda siler - kullanici string yazamaz, sadece rakam (ve istenirse tek bir
 * ondalik ayiraci / bastaki eksi) girebilir. Turkce virgul VE nokta ondalik
 * ayiraci olarak kabul edilir (mevcut num() de ayni sekilde virgulu noktaya
 * cevirip parse ediyor).
 */
export function sanitizeDecimalInput(value, allowNegative = false) {
  let v = String(value).replace(allowNegative ? /[^0-9,.\-]/g : /[^0-9,.]/g, "");
  if (allowNegative) {
    const neg = v.startsWith("-");
    v = v.replace(/-/g, "");
    if (neg) v = "-" + v;
  }
  let sepSeen = false;
  v = v.replace(/[.,]/g, (m) => {
    if (sepSeen) return "";
    sepSeen = true;
    return m;
  });
  return v;
}

/**
 * Bakim/SR orani gibi 0-1 arasi bir KESIR (yuzdelik dilim, orn. 0.2 = %20)
 * bekleyen alanlar icin sanitizeDecimalInput'un uzerine 1'i (%100) gecemeyecek
 * sekilde bir tavan ekler - yoksa kullanici yanlislikla "20" (yani %2000)
 * gibi anlamsiz bir deger yazabiliyordu (sadece karakter filtrelemek yeterli
 * degildi, "0.2" yerine "20" yazmak da sayisal olarak gecerli bir ondalik
 * sayidir).
 */
export function sanitizeRatioInput(value) {
  const cleaned = sanitizeDecimalInput(value);
  if (cleaned === "" || cleaned === "." || cleaned === ",") return cleaned;
  const n = parseFloat(cleaned.replace(",", "."));
  if (isFinite(n) && n > 1) return "1";
  return cleaned;
}

/** sanitizeDecimalInput'un ondalik ayiraci olmayan (tam sayi) hali. */
export function sanitizeIntegerInput(value, allowNegative = false) {
  let v = String(value).replace(allowNegative ? /[^0-9\-]/g : /[^0-9]/g, "");
  if (allowNegative) {
    const neg = v.startsWith("-");
    v = v.replace(/-/g, "");
    if (neg) v = "-" + v;
  }
  return v;
}

export function autoRange(rd) {
  if (!rd) return "";
  const st = new Date(rd.getTime() - 14 * 86400000);
  return trDDMM(st) + " – " + trDDMM(rd);
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
