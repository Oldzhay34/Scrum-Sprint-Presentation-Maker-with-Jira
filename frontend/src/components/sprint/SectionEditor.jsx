import { useRef, useState } from "react";
import { PRIORITY_OPTIONS, SECTOR_OPTIONS } from "../../lib/excelParsers";
import { extractPriority } from "../../lib/geometry";

const fieldStyle = { border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 13, fontFamily: "inherit" };

/** Chip etiketinde ##Öncelik## ve ** isaretlerini gostermeden okunakli bir onizleme uretir. */
function chipLabel(chipText) {
  const { text } = extractPriority(chipText);
  return text.replace(/\*\*/g, "");
}

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
export default function SectionEditor({ sectionKey, def, text, onTextChange, count, chips, onChipUse, onExpand }) {
  const textareaRef = useRef(null);
  const [manualText, setManualText] = useState("");
  const [manualSector, setManualSector] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [manualPriority, setManualPriority] = useState("");

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
          {SECTOR_OPTIONS.map((s) => (
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
      </div>
      <div className="chips">
        {chips.map((chipText) => {
          const label = chipLabel(chipText);
          return (
            <button
              key={chipText}
              type="button"
              className="chip"
              title={label}
              onClick={() => onChipUse(chipText)}
            >
              <span className="plus">+</span>
              {label.length > 52 ? label.slice(0, 50) + "…" : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
