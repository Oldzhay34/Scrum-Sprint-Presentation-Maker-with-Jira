/**
 * Tarih tutarlilik kontrolleri (ISO "YYYY-MM-DD" string karsilastirmasi
 * sozluksel siralamayla dogru calisir, ayrica Date parse etmeye gerek yok).
 * Ilk bulunan hatayi kullanici dostu bir mesaj olarak dondurur, yoksa null.
 */
export function validateDateOrder({ periodStart, periodEnd, members = [], workItems = [] }) {
  if (periodStart && periodEnd && periodStart > periodEnd) {
    return "Dönem başlangıcı, dönem bitişinden sonra olamaz. Lütfen tarihleri kontrol edin.";
  }
  for (const m of members) {
    if (m.startDate && periodEnd && m.startDate > periodEnd) {
      return `"${m.fullName || "İsimsiz üye"}" için işe başlama tarihi, dönem bitişinden (${periodEnd}) sonra olamaz.`;
    }
  }
  for (const wi of workItems) {
    if (wi.addedDate && wi.closedDate && wi.addedDate > wi.closedDate) {
      return `"${wi.title || "İsimsiz iş kalemi"}" için kapanma tarihi, eklenme tarihinden önce olamaz.`;
    }
  }
  return null;
}
