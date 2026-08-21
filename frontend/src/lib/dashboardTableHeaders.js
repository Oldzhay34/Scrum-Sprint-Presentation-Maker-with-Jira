/**
 * Kapasite Dashboard slaytindaki "Kişi Bazlı Kapasite Özeti" tablosunun
 * KOLON basliklari - varsayilan olarak sabitti, kullanici artik bunlari
 * elle degistirebiliyor (bkz. kullanici bildirimi). Hem canli onizleme
 * (DashboardSlideCanvas) hem PPTX ciktisi (dashboardDeckBuilder) AYNI
 * degerleri kullanir - biri digerinden farkli gorunmesin diye.
 */
/* PO notu 2026-08-19:
   - "Kullanılabilir kapasite = Kapasite AG"  -> kolon "Kapasite", altindaki
     birim satiri (AG) zaten DashboardSlideCanvas/dashboardDeckBuilder
     tarafindan ayrica basiliyor, yani basligin tamami "Kapasite (AG)" okunur.
   - "Bakımlı Doluluk% = Kapasite % olarak revize edilecek." */
export const DEFAULT_DASHBOARD_TABLE_HEADERS = {
  kisi: "Kişi",
  toplam: "Toplam İş Yükü",
  tamamlanan: "Tamamlanan",
  acik: "Açık İş Yükü",
  kapasite: "Kapasite",
  doluluk: "Kapasite %",
  durum: "Durum",
};

/**
 * Kolon basliklari kaydedilen sunumun icerigine (content.dashData.tableHeaders)
 * TAM NESNE olarak yaziliyor - yani kullanici tek bir basligi degistirdiyse
 * bile o anki 7 varsayilanin hepsi kayda giriyor. Bu yuzden ESKI adlar,
 * varsayilan degistikten sonra da kayitli sunumlarda yasamaya devam ederdi.
 * Kullanici GERCEKTEN kendi yazdigi bir baslik degil de sadece eski
 * VARSAYILANI tasiyorsa yeni varsayilana tasinir (PO notu 2026-08-19:
 * "Kullanılabilir kapasite = Kapasite AG", "Bakımlı Doluluk% = Kapasite %").
 */
const LEGACY_DEFAULTS = {
  kapasite: ["Kullanılabilir Kapasite"],
  doluluk: ["Bakımlı Doluluk %"],
};

export function resolveTableHeaders(overrides) {
  const merged = { ...DEFAULT_DASHBOARD_TABLE_HEADERS, ...(overrides || {}) };
  Object.entries(LEGACY_DEFAULTS).forEach(([key, legacyValues]) => {
    if (legacyValues.includes(merged[key])) {
      merged[key] = DEFAULT_DASHBOARD_TABLE_HEADERS[key];
    }
  });
  return merged;
}
