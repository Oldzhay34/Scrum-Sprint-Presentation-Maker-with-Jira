import { useEffect, useRef, useState } from "react";

const SLIDE_W = 1280;
const SLIDE_H = 720;

/**
 * Slayt kutusunun boyutuna gore 1280x720 sabit slayt tuvalini olceklendirir
 * (orijinal fitCanvas/fitZoom/fitDash mantigi).
 * Donen `boxRef`'i .slidebox/.zoomstage elemanina, `scale`'i tuvalin
 * transform:scale() degerine ver.
 *
 * Iki ayri mekanizma birlikte kullanilir:
 * 1) ResizeObserver + window "resize" (+ visualViewport "resize") - kutu
 *    boyutu degistiginde ANINDA tetiklenir (buyuk cogunluk senaryo).
 * 2) requestAnimationFrame ile surekli olcum - tarayici zoom'u (Ctrl+scroll)
 *    veya isletim sistemi ekran olcegi degisikligi gibi bazi durumlarda (1)
 *    guvenilir sekilde tetiklenmeyebiliyordu; bu durumda scale eski (buyuk)
 *    degerde kalip tuval kutusunu tasiyor/kirpiyordu (%80 ustu yakinlastirmada
 *    "taşma" sikayeti). rAF, gorunur bir sekmede kaynagi ne olursa olsun bir
 *    sonraki frame'de scale'i senkronlar - maliyeti ihmal edilebilir (tek bir
 *    getBoundingClientRect + karsilastirma / frame).
 */
export function useCanvasFit() {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const next = Math.min(rect.width / SLIDE_W, rect.height / SLIDE_H) * 0.998;
        if (Math.abs(next - scaleRef.current) > 0.0005) {
          scaleRef.current = next;
          setScale(next);
        }
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    let frameId = requestAnimationFrame(function loop() {
      update();
      frameId = requestAnimationFrame(loop);
    });

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return { boxRef, scale };
}
