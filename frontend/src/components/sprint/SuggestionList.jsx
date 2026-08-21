import { useMemo, useState } from "react";
import { PRIORITY_COLORS, PRIORITY_UNSET_COLOR, PRIORITY_UNSET_LABEL } from "../../lib/geometry";
import { DEFAULT_SORT_MODE, SORT_MODES, sortSuggestions, suggestionKey } from "../../lib/suggestions";
import { trDDMM } from "../../lib/format";

/**
 * Excel'den Yükle / Jira'dan Getir sonrasi gelen ONERILERIN listesi.
 *
 * Eskiden bu oneriler SectionEditor icinde sirasiz, yan yana akan "chip"
 * balonlariydi - PO bunun "çok demode ve rastgele" gorundugunu, "bir liste
 * gibi (önceliğe / ekleniş tarihine göre sıralama)" olmasi gerektigini
 * bildirdi (2026-08-19 notu). Bu bilesen ayni veriyi:
 *  - oncelik rengi + etiketiyle,
 *  - sektor rozetiyle,
 *  - ekleniş tarihiyle (Jira'da issue'nun olusturulma tarihi),
 *  - ve secilebilir bir siralama (Öncelik / En yeni / En eski / A-Z) ile
 * gercek bir liste olarak gosterir. "Tümünü ekle" ile o an gorunen tum
 * maddeler tek seferde bolume aktarilabilir.
 *
 * Bir oneriye tiklandiginda (onUse) madde bolume eklenir ve listeden duser -
 * onceki chip davranisiyla AYNI (bkz. SprintPage.jsx onChipUse).
 */
export default function SuggestionList({ items, onUse, emptyHint }) {
  const [sortMode, setSortMode] = useState(DEFAULT_SORT_MODE);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    const base = q ? items.filter((s) => s.label.toLocaleLowerCase("tr").includes(q)) : items;
    return sortSuggestions(base, sortMode);
  }, [items, query, sortMode]);

  // Cok uzun listelerde (Jira'da yuzlerce kayit olabiliyor) panel sayfayi
  // ele gecirmesin diye varsayilan olarak ilk COLLAPSED_COUNT madde gosterilir.
  const COLLAPSED_COUNT = 12;
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filtered.length - visible.length;

  if (!items.length) {
    return emptyHint ? <div className="mhint sugg-empty">{emptyHint}</div> : null;
  }

  return (
    <div className="sugg">
      <div className="sugg-head">
        <span className="sugg-title">
          Öneriler <span className="sugg-count">{filtered.length}</span>
        </span>
        <input
          className="sugg-search"
          placeholder="Ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="sugg-sort" value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
          {SORT_MODES.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="addseg"
          title="Görünen tüm önerileri bu bölüme ekle"
          onClick={() => visible.forEach((s) => onUse(s.text))}
        >
          + Tümünü ekle
        </button>
      </div>

      <ul className="sugg-list">
        {visible.map((s, i) => {
          const color = "#" + (s.priority ? PRIORITY_COLORS[s.priority] || PRIORITY_UNSET_COLOR : PRIORITY_UNSET_COLOR);
          return (
            // Excel'de birebir ayni satir iki kez gecebilir - anahtara sira
            // eklenmezse React "duplicate key" uyarisi verirdi.
            <li className="sugg-item" key={suggestionKey(s) + "#" + i}>
              <span className="sugg-dot" style={{ background: color }} aria-hidden="true" />
              <span className="sugg-main">
                <span className="sugg-label" title={s.label}>{s.label}</span>
                <span className="sugg-meta">
                  <span className="sugg-prio" style={{ color }}>{s.priority || PRIORITY_UNSET_LABEL}</span>
                  {s.sector && <span className="sugg-sector">{s.sector}</span>}
                  {s.childCount > 0 && <span className="sugg-childcount">{s.childCount} iş</span>}
                  {s.addedDate && <span className="sugg-date">{trDDMM(s.addedDate)}</span>}
                </span>
              </span>
              <button type="button" className="sugg-add" title="Bu maddeyi bölüme ekle" onClick={() => onUse(s.text)}>
                + Ekle
              </button>
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <button type="button" className="sugg-more" onClick={() => setExpanded(true)}>
          {hiddenCount} öneri daha göster
        </button>
      )}
      {expanded && filtered.length > COLLAPSED_COUNT && (
        <button type="button" className="sugg-more" onClick={() => setExpanded(false)}>
          Listeyi daralt
        </button>
      )}
      {filtered.length === 0 && <div className="mhint">Aramanla eşleşen öneri yok.</div>}
    </div>
  );
}
