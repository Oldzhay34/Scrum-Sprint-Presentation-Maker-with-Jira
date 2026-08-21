import { useUploadedImage } from "./useUploadedImage";
import { uploadBurndownChart, uploadVelocityChart } from "../lib/apiClient";

/**
 * Kapasite Dashboard sihirbazina eklenen 4. adim: "Velocity & Burndown
 * Parametreleri" - PO'nun Jira'dan aldigi iki ekran goruntusunu (Burndown
 * Chart ekranda USTTE, Velocity Chart ALTTA - bkz. kullanici bildirimi
 * 2026-08-20 ve paylastigi ekran goruntusundeki sira) yukler. Kapak
 * gorseli/arka planiyla AYNI oturuma-ozel desen (bkz. useCoverImage,
 * useCoverBackground) - hicbir sey veritabanina/sunum icerigine
 * KAYDEDILMEZ, PPTX/onizleme SADECE o an yuklu olan gorseli kullanir.
 *
 * Gorsellerin slaytta/PPTX'te NASIL sigdirildigi (ezilme/tasma/ust uste
 * binme olmadan) bu hook'un isi DEGIL - bkz. VelocityBurndownSlideCanvas.jsx
 * ve lib/velocityDeckBuilder.js: onizlemede CSS object-fit:contain,
 * PPTX'te pptxgenjs'in yerlesik sizing:{type:"contain"} ozelligi kullanilir
 * (ikisi de gorselin GERCEK en-boy oranini kendisi hesaplar - PO'nun
 * yukledigi ekran goruntusunun boyutu ne olursa olsun).
 */
export function useVelocityBurndown() {
  const burndown = useUploadedImage(uploadBurndownChart);
  const velocity = useUploadedImage(uploadVelocityChart);
  return { burndown, velocity };
}
