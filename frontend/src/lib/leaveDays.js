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

/**
 * Bir izin kaydinin SADECE verilen pencereye ([fromIso, toIso]) dusen kismini
 * sayar. Pencere disindaysa 0 doner.
 *
 * Neden gerekli: "Kalan Kapasite" ILERIYE donuk bir sayidir (Hedef İş Günü −
 * Geçen İş Günü − İzin). Gecmiste kalan bir izin gunu zaten "Geçen İş Günü"
 * icinde sayildigi icin, ayrica izin olarak da dusulurse kapasite KALICI
 * olarak eksik gorunur. Kullanici bildirimi 2026-08-20: "10 eylülde tam gün
 * izin tanımlı diyelim adama, 10 kapasite-1 adamın kapasitesi; 10 eylülden
 * sonra ise bu kapasite düzelecek, hiçbir gün çıkarılmamış gibi." Kullanici
 * teyidi: olcut RAPOR TARIHI.
 *
 * Backend'in DB tabanli akisi (CapacityDashboardService) bu pencereyi ZATEN
 * uyguluyordu - calculateApprovedLeaveDays(memberId, reportDate, periodEnd).
 * Manuel/Excel akisinda ise izin toplami frontend'de hesaplanip backend'e
 * hazir gonderildigi icin pencere hic uygulanmiyordu; bu fonksiyon o farki
 * kapatir.
 */
export function periodDaysInWindow(p, fromIso, toIso = null) {
  const start = p.startDate > fromIso ? p.startDate : fromIso;
  const end = toIso && p.endDate > toIso ? toIso : p.endDate;
  if (start > end) return 0;
  return businessDaysInRange(start, end) * Number(p.dayFraction || 0);
}

/**
 * sumFractions'in pencere uygulanmis hali - bkz. periodDaysInWindow.
 * `toIso` opsiyoneldir: kurali belirleyen ALT sinirdir (rapor tarihi), ust
 * sinir sadece donem sonu biliniyorsa daraltma amacli verilir.
 * fromIso verilmezse eski (penceresiz) davranisa duser.
 */
export function sumFractionsInWindow(periods, fromIso, toIso = null) {
  if (!fromIso) return sumFractions(periods);
  return (periods || []).reduce((s, p) => s + periodDaysInWindow(p, fromIso, toIso), 0);
}
