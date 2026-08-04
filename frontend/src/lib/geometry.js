// Sprint slaytinin canli onizleme ve PPTX ciktisinda AYNI konumlandirmayi
// kullanmasini saglayan paylasilan geometri sabitleri/fonksiyonlari.
// Orijinal Sprint_Sunum_Uretici.html'deki mantikla birebir aynidir.

export const G = {
  COL_W: 6.16, GAP_X: 0.35, X_L: 0.35, Y_TOP: 1.28, Y_BOT: 7.0, GAP_Y: 0.18,
  PAD_T: 0.12, PAD_B: 0.16, PAD_R: 0.18, ACC_ZONE: 0.30, TITLE_H: 0.46, BUL_GAP: 0.055, ICON: 0.34,
};
G.X_R = G.X_L + G.COL_W + G.GAP_X;

export const SECTION_KEYS = ["done", "active", "risk", "pending"];

export function sectionDefs(assets) {
  return {
    done: { title: "Geçen Sprint'te Yapılanlar", icon: assets.icon_check, accent: "16A34A" },
    active: { title: "Aktif Sprint'te Yapılacaklar", icon: assets.icon_rocket, accent: "2563EB" },
    risk: { title: "Riskler", icon: assets.icon_warn, accent: "E0761F" },
    pending: { title: "Bekleyen Konular", icon: assets.icon_clock, accent: "7C3AED" },
  };
}

const textW = G.COL_W - G.ACC_ZONE - G.PAD_R - 0.16;
export const cplAt = (f) => Math.floor(textW / (f * 0.0086));
export const lhAt = (f) => f * 0.0178 + 0.02;

export function plainLen(t) {
  return String(t).replace(/\*\*/g, "").length;
}

export function bulletsBlockH(items, f) {
  const cpl = cplAt(f), lh = lhAt(f);
  let h = 0;
  items.forEach((t, i) => {
    const L = Math.max(1, Math.ceil((plainLen(t) || 1) / cpl));
    h += L * lh + (i < items.length - 1 ? G.BUL_GAP : 0);
  });
  return h;
}

export const SEGCOL = { green: "8BC34A", blue: "456BBA", orange: "E67514", amber: "E8A64D", red: "D9534F", gray: "9AA3AF", purple: "7C3AED" };
export const BAND = { Y: 1.14, H: 0.44, GAP: 0.30, X: 0.35, W: 13.333 - 0.70 };

export function num(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isFinite(n) ? n : 0;
}

export function bandBars(d) {
  return d.showBand && Array.isArray(d.targets)
    ? d.targets.filter((b) => b && (b.segments || []).filter((s) => s && String(s.value).trim() !== "").length)
    : [];
}

export function cardsTopFor(d) {
  return bandBars(d).length ? BAND.Y + BAND.H + 0.16 : G.Y_TOP;
}

export function cardH(items, f) {
  return G.PAD_T + G.TITLE_H + bulletsBlockH(items, f) + G.PAD_B;
}

// row-aligned: top cards (done|active) share a height, bottom cards (risk|pending) share a height
export function rowHeights(d, f) {
  return { topH: Math.max(cardH(d.done, f), cardH(d.active, f)), botH: Math.max(cardH(d.risk, f), cardH(d.pending, f)) };
}

export function pickFS(d, cardsTop) {
  const avail = G.Y_BOT - cardsTop;
  const cands = [12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5, 7];
  for (const c of cands) {
    const r = rowHeights(d, c);
    if (r.topH + G.GAP_Y + r.botH <= avail) return c;
  }
  return 7;
}

/**
 * Icerik az oldugunda kartlar sadece basligin sigacagi kadar kucuk kaliyor,
 * slaytin buyuk kismi bos gorunuyordu. Dogal (icerik bazli) yukseklikleri
 * hesapladiktan sonra, cardsTop-Y_BOT arasindaki bosluk kalirsa iki satira
 * esit dagitip kartlari alani dolduracak sekilde gerer. Onizleme (SlideCanvas)
 * ve PPTX (sprintDeckBuilder) AYNI fonksiyonu kullanir, ikisi de senkron kalir.
 */
export function stretchRowHeights(topH, botH, cardsTop) {
  const avail = G.Y_BOT - cardsTop;
  const extra = avail - (topH + G.GAP_Y + botH);
  if (extra <= 0) return { topH, botH };
  const add = extra / 2;
  return { topH: topH + add, botH: botH + add };
}

export function parseRuns(t) {
  const parts = String(t).split("**");
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "") continue;
    out.push({ text: parts[i], bold: i % 2 === 1 });
  }
  return out.length ? out : [{ text: String(t), bold: false }];
}
