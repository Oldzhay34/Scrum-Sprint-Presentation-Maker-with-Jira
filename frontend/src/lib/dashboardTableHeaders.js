/**
 * Kapasite Dashboard slaytindaki "Kişi Bazlı Kapasite Özeti" tablosunun
 * KOLON basliklari - varsayilan olarak sabitti, kullanici artik bunlari
 * elle degistirebiliyor (bkz. kullanici bildirimi). Hem canli onizleme
 * (DashboardSlideCanvas) hem PPTX ciktisi (dashboardDeckBuilder) AYNI
 * degerleri kullanir - biri digerinden farkli gorunmesin diye.
 */
export const DEFAULT_DASHBOARD_TABLE_HEADERS = {
  kisi: "Kişi",
  toplam: "Toplam İş Yükü",
  tamamlanan: "Tamamlanan",
  acik: "Açık İş Yükü",
  kapasite: "Kullanılabilir Kapasite",
  doluluk: "Bakımlı Doluluk %",
  durum: "Durum",
};

export function resolveTableHeaders(overrides) {
  return { ...DEFAULT_DASHBOARD_TABLE_HEADERS, ...(overrides || {}) };
}
