// Sprint slaytinin canli onizleme ve PPTX ciktisinda AYNI konumlandirmayi
// kullanmasini saglayan paylasilan geometri sabitleri/fonksiyonlari.
// Orijinal Sprint_Sunum_Uretici.html'deki mantikla birebir aynidir.

export const G = {
  COL_W: 6.16, GAP_X: 0.35, X_L: 0.35, Y_TOP: 1.28, Y_BOT: 7.0, GAP_Y: 0.18,
  PAD_T: 0.12, PAD_B: 0.16, PAD_R: 0.18, ACC_ZONE: 0.30, TITLE_H: 0.46, BUL_GAP: 0.055, ICON: 0.34,
};
G.X_R = G.X_L + G.COL_W + G.GAP_X;

// Kart icin denenecek yazi boyutlari, en buyukten en kucuge. Cok fazla madde
// eklenirse (bkz. pickFS) kucuk uclara kadar inilir ki icerik hicbir zaman
// slayt sinirlarinin disina tasip sessizce kaybolmasin.
export const FS_CANDIDATES = [10.5, 10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4];
export const FS_MIN = FS_CANDIDATES[FS_CANDIDATES.length - 1];

/** Maddeler arasi bosluk, yazi boyutuyla orantili kuculur (sabit kalirsa kucuk fontlarda oranti bozulur). */
export function gapAt(f) {
  return Math.max(0.01, f * 0.0052);
}

// logo_a (aksa) 308x63, logo_b (Kazancı Holding) 227x83 piksel - assets/pptxAssets.js.
export const LOGO_RATIO_A = 308 / 63;
export const LOGO_RATIO_B = 227 / 83;

/**
 * Iki logoyu (aksa + Kazancı Holding) sag kenara dayali, YAN YANA ve ayni
 * yukseklikte konumlandirir - onizlemedeki (.s-logos/.dlogos: display:flex,
 * align-items:center, sabit img height) duzenle BIREBIR AYNI. PPTX export
 * (sprintDeckBuilder/dashboardDeckBuilder) bunu kullanmadan once logolari
 * dikey istifleyip birbirinden bagimsiz x/y degerleriyle konumlandiriyordu -
 * bu da onizlemeyle uyusmayan, "kaymis" gorunen bir export'a yol aciyordu.
 */
export function logoPositions({ rightEdge, top, height, gap = 0.0833 }) {
  const wA = height * LOGO_RATIO_A;
  const wB = height * LOGO_RATIO_B;
  const xA = rightEdge - wA;
  const xB = xA - gap - wB;
  return {
    a: { x: xA, y: top, w: wA, h: height },
    b: { x: xB, y: top, w: wB, h: height },
  };
}

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
  return String(t).replace(/\*\*/g, "").replace(/##(.+?)##/g, "").length;
}

export function bulletsBlockH(items, f) {
  const cpl = cplAt(f), lh = lhAt(f), gap = gapAt(f);
  let h = 0;
  items.forEach((t, i) => {
    const L = Math.max(1, Math.ceil((plainLen(t) || 1) / cpl));
    h += L * lh + (i < items.length - 1 ? gap : 0);
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
  for (const c of FS_CANDIDATES) {
    const r = rowHeights(d, c);
    if (r.topH + G.GAP_Y + r.botH <= avail) return c;
  }
  return FS_MIN;
}

/**
 * En kucuk font boyutunda (FS_MIN) bile icerik sigmiyorsa (asiri sayida madde),
 * fazlalik maddeleri gorunmeden sessizce kaybetmek yerine en dolu bolumden
 * kirpip yerine "+N madde daha" notu birakir - boylece kullanici her zaman
 * neyin gizlendigini gorur. Cogu durumda (FS_MIN'e kadar sigan icerik) hicbir
 * kirpma yapilmaz, sadece font kuculur.
 */
export function fitSectionItems(d, cardsTop) {
  const fs = pickFS(d, cardsTop);
  const avail = G.Y_BOT - cardsTop;
  const fits = (data) => {
    const r = rowHeights(data, fs);
    return r.topH + G.GAP_Y + r.botH <= avail;
  };

  if (fits(d)) return { fs, sections: d };

  const sections = { done: [...d.done], active: [...d.active], risk: [...d.risk], pending: [...d.pending] };
  const removed = { done: 0, active: 0, risk: 0, pending: 0 };
  let guard = 0;
  while (!fits(sections) && guard++ < 1000) {
    const topKey = cardH(sections.done, fs) >= cardH(sections.active, fs) ? "done" : "active";
    const botKey = cardH(sections.risk, fs) >= cardH(sections.pending, fs) ? "risk" : "pending";
    const r = rowHeights(sections, fs);
    const key = r.topH >= r.botH ? topKey : botKey;
    if (sections[key].length <= 1) break;
    sections[key].pop();
    removed[key]++;
  }
  SECTION_KEYS.forEach((k) => {
    if (removed[k] > 0) sections[k].push(`+${removed[k]} madde daha (slayda sığmadı — metni kısaltın veya madde sayısını azaltın)`);
  });
  return { fs, sections };
}

// Öncelik degerlerinin slaytta/PPTX'te gosterilecegi renkler (SEGCOL paletiyle
// tutarli). Metnin yanina yazmak yerine maddenin BAŞINDAKI isaret (•) bu renkte
// gosterilir - bkz. extractPriority. Oncelik belirtilmemis maddelerde isaret
// varsayilan (siyah/INK) kalir.
export const PRIORITY_COLORS = { Kritik: "D9534F", Yüksek: "E67514", Orta: "E8A64D", Düşük: "9AA3AF" };
export const PRIORITY_ORDER = ["Kritik", "Yüksek", "Orta", "Düşük"];
export const PRIORITY_UNSET_LABEL = "Belirtilmedi";
export const PRIORITY_UNSET_COLOR = "1F2937";

/**
 * Madde metninden "##Öncelik##" isaretleyicisini ayiklar (varsa) ve geriye
 * hem oncelik degerini hem de isaretleyici temizlenmis metni doner. Excel'den
 * gelen (formatWorkItemName) ve manuel eklenen (SectionEditor) maddeler ayni
 * kalibi kullanir - bkz. excelParsers.js.
 */
export function extractPriority(t) {
  const str = String(t);
  const m = str.match(/##(.+?)##/);
  if (!m) return { priority: null, text: str };
  let text = str.slice(0, m.index) + str.slice(m.index + m[0].length);
  text = text.replace(/\s*—\s*$/, "").trimEnd();
  return { priority: m[1], text };
}

/** "**metin**" isaretlemesini kalin run'lara ayirir. SlideCanvas ve sprintDeckBuilder ayni sekilde tuketir. */
export function parseRuns(t) {
  const parts = String(t).split("**");
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "") continue;
    out.push({ text: parts[i], bold: i % 2 === 1 });
  }
  return out.length ? out : [{ text: String(t), bold: false }];
}

/** Bir bolumdeki (done/active/...) maddelerden herhangi biri ##Öncelik## isaretleyicisi iceriyor mu? */
export function hasPriorityTags(data) {
  return SECTION_KEYS.some((k) => (data[k] || []).some((t) => /##(.+?)##/.test(String(t))));
}
