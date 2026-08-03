import { useRef } from "react";
import Modal from "../shared/Modal";
import Button from "../shared/Button";

/**
 * Bir bolumu (done/active/risk/pending) buyuk bir alanda duzenlemek icin
 * acilan modal. Ana textarea ile senkron calisir.
 */
export default function EditorModal({ open, sectionKey, def, text, onChange, onClose }) {
  const textareaRef = useRef(null);

  if (!open || !def) return null;

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
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caretStart, caretEnd);
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="mhead">
        <img src={def.icon} alt="" />
        <span className="mt">{def.title}</span>
        <span className="mtools">
          <Button variant="soft" title="Seçili metni kalınlaştır" onClick={wrapBold}>
            <b>B</b> Kalın
          </Button>
          <Button variant="close" onClick={onClose}>
            Kapat
          </Button>
        </span>
      </div>
      <div className="mbody">
        <textarea
          ref={textareaRef}
          id="edText"
          placeholder="Her satıra bir madde."
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mhint">
          Her satır bir madde olur. Kalın için metni seçip <b>B Kalın</b>'a basın (metin <b>**böyle**</b> işaretlenir ve slaytta kalın çıkar).
        </div>
      </div>
    </Modal>
  );
}
