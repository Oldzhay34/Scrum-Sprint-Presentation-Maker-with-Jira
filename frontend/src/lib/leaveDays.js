/**
 * Bir izin kaydinin (start-end tarih araligi) kac IS GUNU (Pazartesi-Cuma)
 * kapsadigini sayar, dayFraction ile carpar. dayFraction TEK bir gunun
 * kesri (orn. 0.5 = yarim gun) - "17-22 Agustos, day_fraction=1" gibi COK
 * GUNLUK bir kayitta bunu sadece "1" olarak toplamak yanlis olurdu (6 gunluk
 * bir blok "1g" gibi gozukurdu, bkz. kullanici bildirimi/DB verisi). Backend'deki
 * LeaveService.calculateApprovedLeaveDays ile AYNI mantik (hafta sonu haric
 * is gunu sayimi) - boylece frontend'de gosterilen/backend'e gonderilen toplam
 * ile backend'in KENDI hesaplayabilecegi deger tutarli kalir.
 *
 * LeaveDaysField.jsx (tekil kisi popover'i) VE autoApplyCompanyHolidays.js
 * (Excel yuklendiginde toplu otomatik ekleme) ORTAK kullanir.
 */
export function businessDaysInRange(startIso, endIso) {
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0=Pazar, 6=Cumartesi
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function periodDays(p) {
  return businessDaysInRange(p.startDate, p.endDate) * Number(p.dayFraction || 0);
}

export function sumFractions(periods) {
  return periods.reduce((s, p) => s + periodDays(p), 0);
}
