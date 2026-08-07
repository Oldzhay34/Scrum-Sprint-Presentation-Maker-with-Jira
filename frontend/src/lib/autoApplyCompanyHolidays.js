import { ensureTeamMember, fetchCompanyWideLeaves, fetchMemberLeaves, createLeavePeriod } from "./apiClient";
import { sumFractions } from "./leaveDays";

/**
 * Excel'den yuklenen kisi listesine, sirket takvimindeki (SIRKET_TATILI) TUM
 * tatil gunlerini OTOMATIK olarak izin kaydi olarak ekler - Excel'deki Toplam/
 * Tamamlanan sayilari zaten bu tatiller dusulmus sekilde hazirlandigi icin
 * (bkz. kullanici bildirimi), kullanicinin her kisi icin tek tek "İzin Ekle"
 * acip sirket takviminden secmesine gerek kalmaz; LeaveDaysField'daki popover
 * yine de acilir ve bu kayitlari "zaten eklenmis" olarak gosterir/duzenlemeye
 * izin verir.
 *
 * Zaten eklenmis (ayni start/end tarihli) kayitlar TEKRAR eklenmez - Excel
 * yeniden yuklenirse/sayfa yenilenirse kopya olusturulmaz. Best-effort: tek
 * bir kisi/tatil basarisiz olursa digerlerini durdurmaz, sessizce atlar (agir
 * bir Excel akisini ilk yuklemede tek bir 400/401 ile tamamen kilitlememek
 * icin - kullanici gerekirse elle "İzin Ekle" ile ekleyebilir).
 *
 * @param {{name:string, role:string}[]} persons
 * @param {number|string} teamId
 * @returns {Promise<Map<string, number>>} kisi adi -> toplam izin gunu (persons
 *   dizisindeki leaveDays alanini guncellemek icin cagiran taraf kullanir)
 */
export async function autoApplyCompanyHolidays(persons, teamId) {
  const totals = new Map();
  if (!teamId || !persons?.length) return totals;

  let holidays;
  try {
    const company = await fetchCompanyWideLeaves();
    holidays = company.filter((c) => c.type === "SIRKET_TATILI");
  } catch {
    return totals; // takvim alinamadiysa sessizce vazgec - kullanici elle ekleyebilir
  }
  if (!holidays.length) return totals;

  for (const p of persons) {
    if (!p.name?.trim()) continue;
    try {
      const member = await ensureTeamMember(teamId, p.name, p.role);
      const existing = await fetchMemberLeaves(member.id);
      const existingKeys = new Set(existing.map((l) => `${l.startDate}_${l.endDate}`));
      const missing = holidays.filter((h) => !existingKeys.has(`${h.startDate}_${h.endDate}`));

      for (const h of missing) {
        await createLeavePeriod({
          name: h.name, type: "YILLIK_IZIN", scope: "TEAM_MEMBER", teamMemberId: member.id,
          startDate: h.startDate, endDate: h.endDate, dayFraction: h.dayFraction,
          description: "Şirket takviminden otomatik eklendi (Excel yükleme)",
        });
      }

      const finalLeaves = missing.length ? await fetchMemberLeaves(member.id) : existing;
      totals.set(p.name, sumFractions(finalLeaves));
    } catch {
      // bu kisi icin basarisiz oldu (orn. ad henuz benzersiz degil) - digerlerine devam
    }
  }
  return totals;
}
