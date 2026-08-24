import { useState } from "react";

/**
 * Tek bir yuklenen gorseli yoneten genel amacli hook - useCoverImage/
 * useCoverBackground ile AYNI desen (FileReader ile aninda base64'e cevirip
 * state'e yazar; ayni dosya arka planda best-effort MinIO'ya da yuklenir,
 * sonucu UI'i bloklamaz). Varsayilan gorseli OLMAYAN (kapak gorseli gibi
 * her zaman dolu degil, Velocity/Burndown gibi BAŞTAN BOŞ olan) yukleme
 * alanlari icin kullanilir - bkz. useVelocityBurndown.js.
 */
export function useUploadedImage(uploadFn) {
  const [url, setUrl] = useState(null);
  // GERCEK piksel boyutlari - CSS object-fit:contain (canli onizleme) bunlara
  // ihtiyac duymaz (tarayici gorsel dosyasindan kendisi okur), ama PPTX
  // ciktisinda pptxgenjs'in sizing:{type:"contain"} ozelligi gorselin GERCEK
  // en-boy oranini SADECE addImage'a KENDI w/h'i olarak verilirse dogru
  // hesaplar - onceden width/height gecirilmedigi icin pptxgenjs bunlari
  // ayrilan kutuyla AYNI kabul edip contain'i sessizce no-op'a (duz "stretch")
  // dusuruyordu (dogrulandi: uretilen PPTX'in srcRect degerleri hep 0 cikti).
  // Bu yuzden dosya secilir secilmez bir <img> ile GERCEK boyut olculur -
  // bkz. lib/velocityDeckBuilder.js.
  const [naturalWidth, setNaturalWidth] = useState(null);
  const [naturalHeight, setNaturalHeight] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  // Kullanicinin gorseli kendi alanina gore buyutup kucultebilmesi icin
  // (bkz. kullanici bildirimi 2026-08-20: "eklediği fotoğrafını büyütüp
  // küçültebilsin", sonra: "yatay ve dikey genişletme için ayrı iki bar
  // koy") - YATAY/DIKEY AYRI AYRI kontrol edilir (uniform tek "zoom" DEGIL).
  // 1 = varsayilan (bugunku "contain" gorunumu, degisiklik yok), >1 ilgili
  // eksende gorseli merkezden buyutup kutuya sigmayan kismini kirpar (bkz.
  // VelocityBurndownSlideCanvas.jsx ".velo-box-imgwrap" ve PPTX tarafinda
  // ayni geometriyi tekrar eden lib/velocityDeckBuilder.js cropToZoom).
  const [zoomX, setZoomX] = useState(1);
  const [zoomY, setZoomY] = useState(1);

  const setFromFile = (file) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setUrl(dataUrl);
      const probe = new Image();
      probe.onload = () => {
        setNaturalWidth(probe.naturalWidth || null);
        setNaturalHeight(probe.naturalHeight || null);
      };
      probe.onerror = () => {
        setNaturalWidth(null);
        setNaturalHeight(null);
      };
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);

    setUploading(true);
    uploadFn(file)
      .catch((err) => setUploadError(err?.message || "Görsel yüklenemedi."))
      .finally(() => setUploading(false));
  };

  const reset = () => {
    setUrl(null);
    setNaturalWidth(null);
    setNaturalHeight(null);
    setUploadError(null);
    setZoomX(1);
    setZoomY(1);
  };

  // Kayitli bir sunum acilirken (bkz. App.jsx applyContent) onceden
  // KAYDEDILMIS bir gorseli geri yukler - setFromFile'in aksine ne FileReader
  // ne uploadFn cagirir (gorsel zaten base64 olarak elde var, yeniden
  // yuklenecek bir Dosya nesnesi yok) - bkz. kullanici bildirimi, 2026-08-21:
  // "velocity&burndown sayfası gelmiyor... ortak sunumdada görmek istiyorum"
  // (bunun icin Velocity&Burndown'in ARTIK content'e kaydedilmesi gerekti,
  // bkz. App.jsx buildSaveContent/veloData).
  const restore = (saved) => {
    if (!saved?.url) {
      reset();
      return;
    }
    setUrl(saved.url);
    setNaturalWidth(saved.naturalWidth ?? null);
    setNaturalHeight(saved.naturalHeight ?? null);
    setZoomX(saved.zoomX ?? 1);
    setZoomY(saved.zoomY ?? 1);
    setUploadError(null);
  };

  return {
    url, naturalWidth, naturalHeight, uploading, uploadError,
    zoomX, setZoomX, zoomY, setZoomY,
    setFromFile, reset, restore,
  };
}
