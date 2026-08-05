/**
 * Backend'deki TeamType enum'unun (team/domain/TeamType.java) frontend karsiligi.
 * FTE takibi (Toplam FTE, FTE Hedef/Gerceklesen/Kalan) sadece RPA'ya ozgu -
 * bu liste, FTE'ye ozgu alanlarin hangi takim tipinde gosterilecegini belirler.
 */
export const TEAM_TYPES = [
  { value: "RPA", label: "RPA Ekibi", hasFte: true },
  { value: "IS_ZEKASI", label: "İş Zekası Ekibi", hasFte: false },
  { value: "GENEL", label: "Diğer / Genel", hasFte: false },
];

export function hasFteTracking(teamType) {
  return TEAM_TYPES.find((t) => t.value === teamType)?.hasFte ?? false;
}

export function teamTypeLabel(teamType) {
  return TEAM_TYPES.find((t) => t.value === teamType)?.label ?? "";
}

/**
 * Personel departman adindan (login yanitindaki "department" - HR sistemindeki
 * Departman_Adi) takim tipini cozumler. Backend'deki TeamType.fromDepartmentName
 * ile AYNI basit "isim icinde arama" mantigi (excelParsers.js/detectTeamType'la
 * da tutarli) - departman adi degisikliklerine/varyasyonlarina karsi dayanikli,
 * kod degisikligi gerektirmez. Eslesme yoksa "GENEL" doner.
 */
export function resolveTeamTypeFromDepartment(department) {
  const d = String(department || "").toLocaleLowerCase("tr");
  if (d.includes("zeka")) return "IS_ZEKASI";
  if (d.includes("rpa")) return "RPA";
  return "GENEL";
}

/** Login yanitindaki personnel.roles (dizi ya da string) icinde ADMIN var mi kontrol eder. */
export function resolveIsAdmin(personnel) {
  const roles = personnel?.roles || [];
  return Array.isArray(roles)
    ? roles.includes("ADMIN")
    : String(roles || "").toUpperCase().includes("ADMIN");
}
