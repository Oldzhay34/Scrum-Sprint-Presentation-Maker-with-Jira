import { useState } from "react";
import { uploadCoverImage } from "../lib/apiClient";

/**
 * Kapak sayfasi arka plan gorselini yonetir. Kullanicinin sectigi dosya
 * FileReader ile hemen base64'e cevrilip state'e yazilir - onizleme ve PPTX
 * export bunu ANINDA kullanir, backend'e ulasilamamasi bu akisi etkilemez.
 * Ayni dosya arka planda (best-effort, tek kullanimlik) MinIO'ya da yuklenir;
 * bu sadece altyapinin hazir oldugunu gostermek icindir, sonucu UI'i bloklamaz.
 */
export function useCoverImage(defaultCoverBg) {
  const [coverBg, setCoverBg] = useState(defaultCoverBg);
  const [isCustom, setIsCustom] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const setFromFile = (file) => {
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverBg(e.target.result);
      setIsCustom(true);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    uploadCoverImage(file)
      .catch((err) => setUploadError(err?.message || "Görsel yüklenemedi."))
      .finally(() => setUploading(false));
  };

  const reset = () => {
    setCoverBg(defaultCoverBg);
    setIsCustom(false);
    setUploadError(null);
  };

  return { coverBg, isCustom, uploading, uploadError, setFromFile, reset };
}
