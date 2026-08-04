import { useEffect, useRef, useState } from "react";

const SLIDE_W = 1280;
const SLIDE_H = 720;

/**
 * Slayt kutusunun boyutuna gore 1280x720 sabit slayt tuvalini olceklendirir
 * (orijinal fitCanvas/fitZoom/fitDash mantigi).
 * Donen `boxRef`'i .slidebox/.zoomstage elemanina, `scale`'i tuvalin
 * transform:scale() degerine ver.
 */
export function useCanvasFit() {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      // getBoundingClientRect() kesirli (sub-pixel) boyut doner; clientWidth
      // tam sayiya yuvarlar - tarayici yakinlastirmasi bu yuvarlamayi buyutup
      // tasmaya (kose logo/yazilarin kirpilmasina) yol acabiliyordu. Genislik
      // VE yuksekligin kucuk olanina gore olcekleyip ("contain" mantigi) hem
      // .slidebox (genislik odakli) hem .zoomstage (aspect-ratio+max-width ile
      // 16:9'dan sapabilen) kutularinda guvenli sigar. %0.2'lik pay tasmayi
      // kesin onler.
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setScale(Math.min(rect.width / SLIDE_W, rect.height / SLIDE_H) * 0.998);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { boxRef, scale };
}
