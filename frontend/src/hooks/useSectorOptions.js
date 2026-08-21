import { useEffect, useState } from "react";
import { fetchSectorOptions } from "../lib/apiClient";

/**
 * Icerik Slayti'ndaki "Sektor (ops.)" dropdown'unun veri kaynagi - her takim
 * icin Jira'dan senkronize edilmis GERCEK sektor listesini ceker (bkz.
 * apiClient.fetchSectorOptions). teamId degistiginde yeniden cekilir.
 */
export function useSectorOptions(teamId) {
  const [sectorOptions, setSectorOptions] = useState([]);

  useEffect(() => {
    if (!teamId) {
      setSectorOptions([]);
      return;
    }
    let cancelled = false;
    fetchSectorOptions(teamId)
      .then((options) => {
        if (!cancelled) setSectorOptions(options || []);
      })
      .catch(() => {
        if (!cancelled) setSectorOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return sectorOptions;
}
