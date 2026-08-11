import { useEffect } from "react";

/**
 * `open` true olunca tarayicinin gercek Fullscreen API'siyle (F11 gibi -
 * sekme/adres cubugu da gizlenir) tam ekrana gecer; false olunca veya modal
 * unmount olunca geri cikar. Kullanici Escape/F11 ile kendisi cikarsa
 * (fullscreenchange event'i) tekrar zorlamiyoruz - tarayicinin kendi
 * davranisina saygi duyuluyor.
 */
export function useFullscreen(open) {
  useEffect(() => {
    if (!open) return;
    const el = document.documentElement;
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    request?.call(el).catch?.(() => {});

    return () => {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        exit?.call(document).catch?.(() => {});
      }
    };
  }, [open]);
}
