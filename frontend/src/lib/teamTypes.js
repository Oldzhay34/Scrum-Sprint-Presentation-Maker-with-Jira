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
