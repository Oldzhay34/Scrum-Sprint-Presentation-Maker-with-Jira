/**
 * Bos deger her zaman gecerli sayilir (opsiyonel alanlar icin) - sadece
 * doldurulmus ama sayi olmayan (harf vb.) girdiler gecersiz sayilir.
 * Virgul da ondalik ayirici olarak kabul edilir (num() ile ayni davranis).
 */
export function isValidNumberInput(value) {
  if (value === "" || value == null) return true;
  return /^-?\d+([.,]\d+)?$/.test(String(value).trim());
}
