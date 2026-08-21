import { useState } from "react";
import { uploadCoverBackground } from "../lib/apiClient";

/**
 * Kapak slaydinin TAM ZEMIN arka planini yonetir - "Kapak Görseli"nden
 * (useCoverImage) FARKLI bir katman: cover_bg (Kapak Görseli) her zaman
 * slaydin tamamini kaplayan bir gorsel/illustrasyondur (varsayilan Aksa
 * temasinda soldaki bosluk SEFFAF PNG bolgesidir) - bu hook'un yonettigi
 * "arka plan" ise o seffaf bolgelerden gorunecek ALT katmandir (bkz.
 * SlideCanvas.jsx "cov-page-bg", kullanici bildirimi, 2026-08-17: "bu sayfaya
 * sunumun arka planını yükleme alanı yap ... sadece arka plan"). Varsayilan
 * DEGER YOK (null) - kullanici hicbir sey yuklemezse bugunku (duz beyaz/canvas
 * rengi) gorunum AYNEN korunur, hicbir mevcut sunum etkilenmez.
 */
export function useCoverBackground() {
  const [bg, setBg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const setFromFile = (file) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setBg(e.target.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    uploadCoverBackground(file)
      .catch((err) => setUploadError(err?.message || "Arka plan yüklenemedi."))
      .finally(() => setUploading(false));
  };

  const reset = () => {
    setBg(null);
    setUploadError(null);
  };

  return { bg, uploading, uploadError, setFromFile, reset };
}
