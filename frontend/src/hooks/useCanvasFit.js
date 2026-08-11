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
 *
 * `fitParent: true` (zoomstage/tam ekran onizleme kullanimlari icin): kutunun
 * kendi boyutunu CSS aspect-ratio'ya birakmak yerine, EBEVEYNinin
 * (zoomstagewrap) olcumune gore en buyuk 16:9 kutuyu piksel cinsinden
 * kendisi hesaplayip boxRef elemanina yazar - CSS aspect-ratio + flex
 * align-items:center kombinasyonunun bazi tarayicilarda kutuyu ebeveynin
 * tam boyutuna oturtamamasi (sagda/altta bosluk kalmasi) sorununu JS
 * tarafinda kesin olarak cozer. .slidebox gibi zaten sabit/CSS ile dogru
 * boyutlanan kullanimlar bu davranisi istemez, bu yuzden varsayilan false.
 *
 * `active`: ZoomModal/PresentationRunnerModal/ExportPreviewModal, App.jsx'te
 * KOSULSUZ (open=false iken de) DOM'da kalir - Modal.jsx sadece kendi ICINDE
 * `open` false'ken null doner. Yani bu bilesenler ilk once open=false ile
 * mount olur ve o anda boxRef.current henuz null'dur (.zoomstage hic
 * render edilmemistir); dependency array'i bunu yakalayamazsa efekt bir
 * daha hic calismaz, scale sonsuza dek baslangic degeri (1) - yani
 * olceksiz/kucuk tuval - olarak kalir. `active` (genelde `open`) her
 * degistiginde efekti yeniden calistirip o anki (artik dolu) boxRef.current'i
 * yakalamak icin var.
 */
export function useCanvasFit({ fitParent = false, active = true } = {}) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);

  useEffect(() => {
    if (!active) return;
    const el = boxRef.current;
    if (!el) return;
    const measureEl = fitParent ? el.parentElement || el : el;

    const update = () => {
      const rect = measureEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const fit = Math.min(rect.width / SLIDE_W, rect.height / SLIDE_H);
        if (fitParent) {
          el.style.width = `${SLIDE_W * fit}px`;
          el.style.height = `${SLIDE_H * fit}px`;
        }
        const next = fit;
        if (Math.abs(next - scaleRef.current) > 0.0005) {
          scaleRef.current = next;
          setScale(next);
        }
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(measureEl);
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
  }, [fitParent, active]);

  return { boxRef, scale };
}
