import { useRef, useState } from "react";
import { PRIORITY_OPTIONS, SECTOR_OPTIONS } from "../../lib/excelParsers";
import { extractPriority, extractComment, withComment, linesOf } from "../../lib/geometry";
import SuggestionList from "./SuggestionList";

const fieldStyle = { border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 13, fontFamily: "inherit" };

const PLACEHOLDERS = {
  done: "Her satıra bir madde yazın.\nÖrn: Fiyat Hesaplama Motoru projesi canlı ortama aktarıldı.",
  active: "Bu sprintte yapılacaklar…",
  risk: "Öngörülen riskler…",
  pending: "Beklemedeki / iş biriminden dönüş bekleyen konular…",
};

/**
 * Tek bir icerik bolumu (Gecen Sprint'te Yapilanlar / Aktif / Riskler / Bekleyen).
 * Pressman - User Help Facilities: her bolumde placeholder ornegi ve
 * "Başlık: açıklama" bicimlendirme ipucu gosterilir.
 */
export default function SectionEditor({ sectionKey, def, text, onTextChange, count, chips, onChipUse, onExpand, teamType, sectorOptions }) {
  // Takimin Jira'dan senkronize edilmis GERCEK sektor listesi varsa o kullanilir
  // (bkz. useSectorOptions/apiClient.fetchSectorOptions) - henuz hic senkronize
  // edilmemis (veya Jira'ya hic bagli olmayan, orn. Excel/Manuel) bir takim icin
  // eski sabit listeye (SECTOR_OPTIONS) duser, dropdown hicbir zaman bomboş kalmaz.
  const sectorList = sectorOptions && sectorOptions.length ? sectorOptions : SECTOR_OPTIONS;
  const textareaRef = useRef(null);
  const [manualText, setManualText] = useState("");
  const [manualSector, setManualSector] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [manualPriority, setManualPriority] = useState("");
  // Yorum ekleme ozelligi tum takim tiplerine acik.
  // acikIdx: kullanicinin "+ Yorum" ile actigi, henuz yorumu olmayan satirlarin
  // indexleri - yorumu zaten olan satirlar her zaman acik gosterilir.
  const [openCommentIdx, setOpenCommentIdx] = useState(() => new Set());

  const handleClear = () => {
    if (!text.trim()) return;
    if (!window.confirm("Bu bölümdeki tüm maddeler silinecek. Emin misiniz?")) return;
    onTextChange("");
  };

  const updateLineAt = (idx, newLine) => {
    const items = linesOf(text);
    items[idx] = newLine;
    onTextChange(items.join("\n"));
  };

  const removeLineAt = (idx) => {
    const items = linesOf(text).filter((_, i) => i !== idx);
    onTextChange(items.join("\n"));
  };

  const toggleCommentOpen = (idx) => {
    setOpenCommentIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addManualLine = () => {
    const trimmed = manualText.trim();
    if (!trimmed) return;
    const plainTags = [manualSector, manualDept.trim()].filter(Boolean);
    let suffix = "";
    if (plainTags.length) suffix += ` — **${plainTags.join(" · ")}**`;
    if (manualPriority) suffix += (suffix ? " " : " — ") + `##${manualPriority}##`;
    onChipUse(suffix ? `${trimmed}${suffix}` : trimmed);
    setManualText("");
    setManualSector("");
    setManualDept("");
    setManualPriority("");
  };

  const wrapBold = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart || 0, e = ta.selectionEnd || 0, v = ta.value, sel = v.slice(s, e);
    let next, caretStart, caretEnd;
    if (sel) {
      next = v.slice(0, s) + "**" + sel + "**" + v.slice(e);
      caretStart = s + 2;
      caretEnd = e + 2;
    } else {
      next = v.slice(0, s) + "****" + v.slice(s);
      caretStart = caretEnd = s + 2;
    }
    onTextChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caretStart, caretEnd);
    });
  };

  return (
    <div className={`sec ${sectionKey}`} data-k={sectionKey}>
      <img className="sec-watermark" src={def.icon} alt="" aria-hidden="true" />
      <div className="head">
        <img src={def.icon} alt="" />
        <span className="t">{def.title}</span>
        <span className="tools">
          <span className="n">{count}</span>
          <button type="button" className="tb bold" title="Seçili metni kalınlaştır" onClick={wrapBold}>
            B
          </button>
          <button type="button" className="tb exp" title="Büyüt" onClick={onExpand}>
            ⤢
          </button>
        </span>
      </div>
      <textarea
        ref={textareaRef}
        placeholder={PLACEHOLDERS[sectionKey]}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
      />
      <div className="hint">
        İpucu: <b>Başlık: açıklama</b> yazarsanız başlık kalın görünür.
      </div>
      <div className="segrow" style={{ marginTop: 6 }}>
        <input
          style={{ ...fieldStyle, flex: "1 1 200px" }}
          placeholder="Madde ekle — departman/öncelik seçip ekleyebilirsiniz"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addManualLine();
            }
          }}
        />
        <select style={{ ...fieldStyle, flex: "0 0 120px" }} value={manualSector} onChange={(e) => setManualSector(e.target.value)}>
          <option value="">Sektör (ops.)</option>
          {sectorList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          style={{ ...fieldStyle, flex: "0 0 140px" }}
          placeholder="Departman (ops.)"
          value={manualDept}
          onChange={(e) => setManualDept(e.target.value)}
        />
        <select style={{ ...fieldStyle, flex: "0 0 120px" }} value={manualPriority} onChange={(e) => setManualPriority(e.target.value)}>
          <option value="">Öncelik (ops.)</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button type="button" className="addseg" onClick={addManualLine}>
          + Ekle
        </button>
        <button type="button" className="delbar" title="Bu bölümdeki tüm maddeleri sil" onClick={handleClear}>
          Temizle
        </button>
      </div>
      {/* Excel/Jira onerileri - eskiden sirasiz "chip" balonlariydi, artik
          oncelige/ekleniş tarihine gore siralanabilen gercek bir liste
          (bkz. SuggestionList.jsx, PO notu 2026-08-19). */}
      <SuggestionList items={chips} onUse={onChipUse} />
      <div className="comment-panel">
        <div className="panelttl" style={{ marginTop: 10 }}>Eklenen maddeler</div>
        <div className="hint" style={{ marginBottom: 6 }}>
          Bir maddeyi × ile slayttan çıkarabilirsiniz.
          {" Bir maddeye yorum eklerseniz, slaytta o maddenin altında öne çıkan bir not olarak görünür."}
        </div>
        {linesOf(text).map((line, i) => {
          const { text: itemText, comment } = extractComment(line);
          const { text: plain } = extractPriority(itemText);
          const label = plain.replace(/\*\*/g, "");
          const open = comment !== "" || openCommentIdx.has(i);
          return (
            <div className="bar" key={i}>
              <div className="barrow">
                <span className="barlabel" style={{ flex: "1 1 240px", background: "transparent", border: 0, padding: "6px 2px" }} title={label}>
                  {label.length > 70 ? label.slice(0, 68) + "…" : label}
                </span>
                {!open && (
                  <button type="button" className="addseg" onClick={() => toggleCommentOpen(i)}>
                    Yorum ekle
                  </button>
                )}
                {comment && (
                  <button type="button" className="delbar" onClick={() => updateLineAt(i, withComment(itemText, ""))}>
                    Yorumu sil
                  </button>
                )}
                <button type="button" className="delseg" title="Maddeyi slayttan çıkar" onClick={() => removeLineAt(i)}>
                  ×
                </button>
              </div>
              {open && (
                <input
                  className="barlabel"
                  style={{ marginTop: 6, width: "100%" }}
                  placeholder="Bu madde için yorum yazın…"
                  value={comment}
                  onChange={(e) => updateLineAt(i, withComment(itemText, e.target.value))}
                  autoFocus={!comment}
                />
              )}
            </div>
          );
        })}
        {linesOf(text).length === 0 && <div className="mhint">Henüz madde eklenmedi.</div>}
      </div>
    </div>
  );
}
