import { useEffect } from "react";

/**
 * Genel amacli modal kabuğu. Orijinal HTML'deki davranisi birebir korur:
 * backdrop'a tiklama ve Escape tusu modali kapatir.
 */
export default function Modal({ open, onClose, boxClassName = "box", children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={boxClassName}>{children}</div>
    </div>
  );
}
