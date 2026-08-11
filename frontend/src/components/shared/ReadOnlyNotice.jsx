import { teamTypeLabel } from "../../lib/teamTypes";

/**
 * Kullanicinin auth'una yetmeyen bir takimin sunumunu duzenlemeye calistiginda
 * parametre alma yerlerinde bu bilgilendirme gosterilir - sag taraftaki
 * onizleme (UnifiedPreviewPane/ZoomModal) o takimin EN SON kayitli sunumunu
 * salt-okunur gosterir (bkz. App.jsx/loadTeamPresentation).
 *
 * view: App.jsx'teki readOnlyView durumu - yukleniyor / kayitli sunum yok /
 * hata / yuklendi (takim adi, sprint no, son guncelleyen) hallerini ayirt
 * eder. Verilmezse (veya null ise) sadece genel yetki metni gosterilir.
 */
export default function ReadOnlyNotice({ teamType, view }) {
  const label = view?.teamName || teamTypeLabel(teamType);
  const who = label ? `"${label}"` : "Bu takıma ait";

  let detail;
  if (view?.loading) {
    detail = `${who} takımının en son sprint sunumu yükleniyor…`;
  } else if (view?.error) {
    detail = `${who} takımının sunumu yüklenemedi: ${view.error}`;
  } else if (view?.empty) {
    detail = `${who} takımının henüz kaydedilmiş bir sunumu yok — önizlemede gösterilecek içerik bulunamadı.`;
  } else if (view?.sprintNo) {
    const updated = view.updatedAt ? new Date(view.updatedAt).toLocaleString("tr-TR") : null;
    detail =
      `${who} takımının ${view.sprintNo}. sprint sunumunu (en güncel sürüm) salt-okunur görüntülüyorsunuz` +
      (updated ? ` — son güncelleme: ${updated}` : "") +
      (view.updatedBy ? ` (${view.updatedBy})` : "") +
      ". Sadece yetkili olduğunuz takımların sunumlarını düzenleyebilirsiniz.";
  } else {
    detail = `${who} bir sunumu görüntülüyorsunuz — sadece yetkili olduğunuz takımların sunumlarını düzenleyebilirsiniz. Sağ taraftaki önizleme salt-okunur olarak güncel kalmaya devam eder.`;
  }

  return (
    <div className="bandpanel" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{view?.empty ? "📭" : "🔒"}</div>
      <p className="panelttl" style={{ justifyContent: "center" }}>
        {view?.empty ? "Bu takımın kayıtlı sunumu yok" : "Bu sunumu düzenleme yetkiniz yok"}
      </p>
      <div className="hint">{detail}</div>
    </div>
  );
}
