/**
 * Backend'deki TeamType enum'unun (team/domain/TeamType.java) frontend karsiligi.
 * FTE takibi (Toplam FTE, FTE Hedef/Gerceklesen/Kalan) sadece RPA'ya ozgu -
 * bu liste, FTE'ye ozgu alanlarin hangi takim tipinde gosterilecegini belirler.
 */
export const TEAM_TYPES = [
  { value: "RPA", label: "RPA Ekibi", hasFte: true },
  { value: "IS_ZEKASI", label: "İş Zekası Ekibi", hasFte: false },
  { value: "URUN_GELISTIRME", label: "Ürün Geliştirme Ekibi", hasFte: false },
  { value: "YAPAY_ZEKA", label: "Yapay Zeka Ekibi", hasFte: false },
  { value: "DIJITAL_UYGULAMALAR", label: "Dijital Uygulamalar Ekibi", hasFte: false },
  { value: "KONUM_TABANLI_URUN_GELISTIRME", label: "Konum Tabanlı Ürün Geliştirme Ekibi", hasFte: false },
  { value: "DSYS", label: "Doküman ve Süreç Yönetim Sistemi Ekibi", hasFte: false },
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
  if (d.includes("rpa")) return "RPA";
  if (d.includes("yapay")) return "YAPAY_ZEKA";
  if (d.includes("zeka")) return "IS_ZEKASI";
  if (d.includes("konum")) return "KONUM_TABANLI_URUN_GELISTIRME";
  if (d.includes("ürün") || d.includes("urun")) return "URUN_GELISTIRME";
  if (d.includes("dijital")) return "DIJITAL_UYGULAMALAR";
  if (d.includes("doküman") || d.includes("dokuman") || d.includes("süreç yönetim") || d.includes("dsys")) return "DSYS";
  return "GENEL";
}

/**
 * TeamType -> Jira proje anahtarı (docs/jira-endpoint-plani.md Faz 0 keşfiyle
 * kazanciholding.atlassian.net üzerinde GET /rest/api/3/project/search ile
 * doğrulanmış gerçek eşlemeler - bkz. JiraDiscoveryController). Burada
 * olmayan bir teamType için Jira'dan çekme yapılamaz (proje anahtarı henüz
 * bilinmiyor) - handleJiraSync bu durumda kullanıcıyı açıkça bilgilendirir.
 */
export const JIRA_PROJECT_KEY_BY_TEAM_TYPE = {
  RPA: "RPA",
  IS_ZEKASI: "IZ",
  YAPAY_ZEKA: "YZ",
  DSYS: "DSYS",
  KONUM_TABANLI_URUN_GELISTIRME: "CBS",
  DIJITAL_UYGULAMALAR: "DA",
};

export function resolveJiraProjectKey(teamType) {
  return JIRA_PROJECT_KEY_BY_TEAM_TYPE[teamType] ?? null;
}

/** Login yanitindaki personnel.roles (dizi ya da string) icinde ADMIN var mi kontrol eder. */
export function resolveIsAdmin(personnel) {
  const roles = personnel?.roles || [];
  return Array.isArray(roles)
    ? roles.includes("ADMIN")
    : String(roles || "").toUpperCase().includes("ADMIN");
}
