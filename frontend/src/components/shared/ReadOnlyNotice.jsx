import { teamTypeLabel } from "../../lib/teamTypes";

/**
 * Kullanicinin auth'una yetmeyen bir takimin sunumunu duzenlemeye calistiginda
 * parametre alma yerlerinde bu bilgilendirme gosterilir - sag taraftaki
 * onizleme (UnifiedPreviewPane/ZoomModal) zaten inherently salt-okunur oldugu
 * icin (bkz. SlideCanvas.jsx - artik hicbir yerde inline duzenleme yok)
 * guncel/gorunur kalmaya devam eder, sadece SOL taraftaki form burada
 * degistirilir.
 */
export default function ReadOnlyNotice({ teamType }) {
  const label = teamTypeLabel(teamType);
  return (
    <div className="bandpanel" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
      <p className="panelttl" style={{ justifyContent: "center" }}>Bu prensentation'ı düzenleme yetkiniz yok</p>
      <div className="hint">
        {label ? `"${label}"` : "Bu takıma ait"} bir sunumu görüntülüyorsunuz — sadece kendi takımınızın sunumunu
        düzenleyebilirsiniz. Sağ taraftaki önizleme salt-okunur olarak güncel kalmaya devam eder.
      </div>
    </div>
  );
}
