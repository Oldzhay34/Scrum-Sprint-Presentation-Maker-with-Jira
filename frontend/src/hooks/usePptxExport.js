import { useState } from "react";

/**
 * PPTX uretimini (async) loading/error durumlariyla sarar.
 * Pressman - System Response Time: `loading` true iken cagiran taraf
 * butonu disable edip "Hazırlanıyor…" gostermeli.
 * Pressman - Error Information Handling: hata durumunda alert() yerine
 * `error` state'i doner - UI bunu ErrorBanner ile gosterir.
 */
export function usePptxExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (buildAndSave) => {
    setLoading(true);
    setError(null);
    try {
      await buildAndSave();
      return true;
    } catch (err) {
      setError(err?.message || "PPTX üretilirken beklenmeyen bir hata oluştu.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, setError, run };
}
