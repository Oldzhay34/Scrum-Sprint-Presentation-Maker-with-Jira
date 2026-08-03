import { useRef } from "react";

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
      <div className="chips">
        {chips.map((chipText) => (
          <button
            key={chipText}
            type="button"
            className="chip"
            title={chipText}
            onClick={() => onChipUse(chipText)}
          >
            <span className="plus">+</span>
            {chipText.length > 52 ? chipText.slice(0, 50) + "…" : chipText}
          </button>
        ))}
      </div>
    </div>
  );
}
