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
  "Yüksek Risk": { fg: "B91C1C", bg: "FEE2E2", bar: "DC2626" },
  Risk: { fg: "C2410C", bg: "FFEDD5", bar: "EA580C" },
  Dikkat: { fg: "B45309", bg: "FEF3C7", bar: "D97706" },
  Uygun: { fg: "15803D", bg: "DCFCE7", bar: "16A34A" },
};

export function dStatus(durum, ratio) {
  let label = durum;
  if (typeof ratio === "number") label = ratio >= 1.2 ? "Yüksek Risk" : ratio >= 1.0 ? "Risk" : ratio >= 0.85 ? "Dikkat" : "Uygun";
  return Object.assign({ label }, STATUS_STYLE_MAP[label] || STATUS_STYLE_MAP["Uygun"]);
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

export function autoRange(rd) {
  if (!rd) return "";
  const st = new Date(rd.getTime() - 14 * 86400000);
  return trDDMM(st) + " – " + trDDMM(rd);
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
