import { useEffect } from "react";

/**
 * Engelleyici, "premium" gorunumlu uyari/hata modali. Tarih tutarsizligi gibi
 * kullanicinin mutlaka gormesi/duzeltmesi gereken durumlar icin kullanilir.
 * Pressman - Error Information Handling: mesaj net, eylem tek ve acik ("Anladım").
 */
export default function AlertModal({ open, title = "Uyarı", message, onClose }) {
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
      className="alert-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="alert-modal-box" role="alertdialog" aria-modal="true" aria-labelledby="alertModalTitle">
        <div className="alert-modal-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 id="alertModalTitle" className="alert-modal-title">{title}</h3>
        <p className="alert-modal-message">{message}</p>
        <button type="button" className="btn primary alert-modal-action" onClick={onClose}>
          Anladım
        </button>
      </div>
    </div>
  );
}
