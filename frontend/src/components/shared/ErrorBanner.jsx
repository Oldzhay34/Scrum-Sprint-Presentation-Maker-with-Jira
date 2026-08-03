/**
 * Pressman - Error Information Handling: backend'in `ApiErrorResponse`
 * (timestamp, status, error, message, path) yapisini normalize edip
 * kullaniciya anlasilir sekilde gosterir. Genel hata mesaji ile alan bazli
 * hatalar (varsa) ayri render edilir - kullanici hangi alani duzeltmesi
 * gerektigini karistirmamali.
 *
 * `error` şu şekillerden biri olabilir:
 *  - string: dogrudan genel mesaj
 *  - {message, status, error}: backend ApiErrorResponse
 *  - {message, fieldErrors:{alan: mesaj}}: alan bazli hatalari da tasiyan normalize edilmis form
 *  - Error: JS hata nesnesi (err.message kullanilir)
 */
export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  const normalized = normalizeError(error);

  return (
    <div className="warn" role="alert" style={{ margin: "10px 22px", display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div>{normalized.message}</div>
        {normalized.fieldErrors && Object.keys(normalized.fieldErrors).length > 0 && (
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {Object.entries(normalized.fieldErrors).map(([field, msg]) => (
              <li key={field}>
                <b>{field}</b>: {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Hata mesajını kapat"
          style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "#92400E" }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function normalizeError(error) {
  if (typeof error === "string") return { message: error };
  if (error instanceof Error) return { message: error.message || "Beklenmeyen bir hata oluştu." };
  if (error && typeof error === "object") {
    const message = error.message || "Beklenmeyen bir hata oluştu.";
    const suffix = error.status ? ` (HTTP ${error.status}${error.error ? " · " + error.error : ""})` : "";
    return { message: message + suffix, fieldErrors: error.fieldErrors };
  }
  return { message: "Beklenmeyen bir hata oluştu." };
}
