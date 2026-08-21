import { PRIORITY_ORDER, PRIORITY_UNSET_LABEL, extractPriority } from "./geometry";

/**
 * İçerik Slaytı'nin oneri (Excel'den Yükle / Jira'dan Getir) modeli.
 *
 * ONCEDEN oneriler DUZ STRING listesiydi ve SectionEditor bunlari sirasiz,
 * yan yana dizilen "chip" balonlari olarak basiyordu - PO bunun "çok demode ve
 * rastgele" gorundugunu bildirdi (2026-08-19 notu). Artik her oneri, metnin
 * yaninda siralama/gruplama icin gereken meta veriyi de tasiyan bir NESNE:
 * boylece SuggestionList.jsx onerileri gercek bir liste olarak, oncelige veya
 * ekleniş tarihine gore SIRALI gosterebiliyor.
 *
 * `text` alani, maddeye eklendiginde bolum metnine yazilacak HAM satirdir
 * (## Öncelik ## ve **etiket** isaretleyicileri dahil - bkz. formatWorkItemName);
 * `label` ise kullaniciya gosterilen temizlenmis halidir.
 */
export function makeSuggestion(text, { priority = null, sector = null, addedDate = null, childCount = 0, source = "excel" } = {}) {
  const { text: withoutPriority } = extractPriority(String(text));
  // formatWorkItemName, sektor/departman etiketini metnin SONUNA " — **X · Y**"
  // olarak ekler. Listede bu bilgi zaten ayri bir rozet olarak gosterildigi
  // icin etiketten cikarilir - aksi halde ayni sektor satirda iki kere gorunur.
  const withoutTrailingTags = withoutPriority.replace(/\s*—\s*\*\*[^*]*\*\*\s*$/, "");
  return {
    text: String(text),
    label: withoutTrailingTags.replace(/\*\*/g, "").trim(),
    priority: priority || null,
    sector: sector || null,
    addedDate: addedDate || null,
    childCount,
    source,
  };
}

/** Eski (duz string) oneri listelerini yeni nesne bicimine cevirir - geriye donuk uyumluluk icin. */
export function normalizeSuggestion(entry, source = "excel") {
  return typeof entry === "string" ? makeSuggestion(entry, { source }) : entry;
}

export const SORT_MODES = [
  { key: "priority", label: "Önceliğe göre" },
  { key: "newest", label: "Önce en yeni" },
  { key: "oldest", label: "Önce en eski" },
  { key: "alpha", label: "Alfabetik (A-Z)" },
];

export const DEFAULT_SORT_MODE = "priority";

/** PRIORITY_ORDER'daki sira (Kritik=0 ... Düşük=3); belirtilmemis oncelik HER ZAMAN en sona. */
function priorityRank(priority) {
  const idx = PRIORITY_ORDER.indexOf(priority);
  return idx === -1 ? PRIORITY_ORDER.length : idx;
}

/** Tarihi karsilastirilabilir bir sayiya cevirir; tarihi olmayan kayitlar siralamada en sona duser. */
function dateValue(addedDate) {
  if (!addedDate) return null;
  const t = new Date(addedDate).getTime();
  return Number.isFinite(t) ? t : null;
}

function byDate(a, b, direction) {
  const av = dateValue(a.addedDate);
  const bv = dateValue(b.addedDate);
  if (av == null && bv == null) return a.label.localeCompare(b.label, "tr");
  if (av == null) return 1;
  if (bv == null) return -1;
  return direction === "desc" ? bv - av : av - bv;
}

/**
 * Onerileri secilen moda gore siralar - ORIJINAL diziyi degistirmez.
 * "priority" modunda esitlik durumunda once en yeni kayit gelir (ayni
 * oncelikteki isler arasinda guncel olan once gorunsun).
 */
export function sortSuggestions(list, mode = DEFAULT_SORT_MODE) {
  const items = [...(list || [])];
  switch (mode) {
    case "newest":
      return items.sort((a, b) => byDate(a, b, "desc"));
    case "oldest":
      return items.sort((a, b) => byDate(a, b, "asc"));
    case "alpha":
      return items.sort((a, b) => a.label.localeCompare(b.label, "tr"));
    case "priority":
    default:
      return items.sort((a, b) => {
        const diff = priorityRank(a.priority) - priorityRank(b.priority);
        return diff !== 0 ? diff : byDate(a, b, "desc");
      });
  }
}

export function priorityLabelOf(suggestion) {
  return suggestion.priority || PRIORITY_UNSET_LABEL;
}

/** Listedeki bir oneriyi (metnine gore) ayirt etmek icin kullanilan anahtar. */
export function suggestionKey(suggestion) {
  return suggestion.text;
}
