import { useEffect, useRef, useState } from "react";

const SLIDE_W = 1280;

/**
 * Slayt kutusunun genisligine gore 1280px genislikteki sabit slayt tuvalini
 * olceklendirir (orijinal fitCanvas/fitZoom/fitDash mantigi).
 * Donen `boxRef`'i .slidebox elemanina, `scale`'i tuvalin transform:scale() degerine ver.
 */
export function useCanvasFit() {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(width / SLIDE_W);
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
