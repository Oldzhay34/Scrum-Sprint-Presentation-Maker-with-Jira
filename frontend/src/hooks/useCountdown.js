import { useEffect, useRef, useState } from "react";

/**
 * Saniye bazlı geri sayım. `active` true olduğunda `totalSeconds`'tan
 * başlar; `active` false olunca durur ve bir sonraki `active=true`'da
 * (veya `totalSeconds` değişince, örn. sıradaki takıma geçilince) sıfırdan
 * başlar. `onExpire`, süre tam 0'a ulaştığı an BİR KEZ çağrılır (örn.
 * sıradaki takıma otomatik geçiş gibi yan etkiler için).
 */
export function useCountdown(totalSeconds, active, onExpire) {
  const [remaining, setRemaining] = useState(totalSeconds ?? 0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(totalSeconds ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSeconds, active]);

  useEffect(() => {
    if (!active || !totalSeconds || totalSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onExpireRef.current?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, totalSeconds]);

  return remaining;
}

export function formatMmSs(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
