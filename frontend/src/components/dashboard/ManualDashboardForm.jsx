import Button from "../shared/Button";
import ErrorBanner from "../shared/ErrorBanner";
import AlertModal from "../shared/AlertModal";
import CustomKpiEditor from "./CustomKpiEditor";
import MemberCard from "./MemberCard";
import { IconPlusCircle } from "../shared/icons";
import { sanitizeIntegerInput, sanitizeRatioInput } from "../../lib/format";

/**
 * Kartin herhangi bir bos noktasina (input/select'in disina) tiklaninca da
 * kendi input/select'ini odaklar - JiraDashboardPanel.jsx'teki AYNI davranis
 * (bkz. kullanici bildirimi, 2026-08-17: "üstüne tıklandığında seçilip
 * paramtre değiştirilebilsin").
 */
function focusTileField(e) {
  if (e.target.closest("input, select, textarea")) return;
  e.currentTarget.querySelector("input, select, textarea")?.focus();
}

/**
 * Kapasite Dashboard'un "Manuel Gir" modu: Excel gerekmeden, ekip uyesi ve is
 * kalemi formlariyla veri girip backend'in stateless endpoint'ine hesaplatir.
 * Hicbir sey kaydedilmez (Pressman - System Response Time: hesaplama sirasinda
 * "Hesapla" butonu disable olup "Hesaplanıyor…" gosterir).
 * Ust parametre karti JiraDashboardPanel.jsx ile AYNI premium-tile (gradyanli,
 * odakta yukselen) gorunumu kullanir - eskiden duz .field/.deltagrid kutulariydi
 * (bkz. kullanici bildirimi, 2026-08-17: "bu kartı da aynı şekilde premium
 * istiyorum ... apple UI/UX örnek al").
 */
export default function ManualDashboardForm({ m, teamId }) {
  return (
    <>
      <div className="bandpanel">
        <div className="premium-tile-grid premium-tile-grid-compact">
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">Ekip adı</div>
            <input value={m.team} onChange={(e) => m.setTeam(e.target.value)} placeholder="örn: RPA Ekibi" />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">
              Sprint No <span className="opt">opsiyonel</span>
            </div>
            <input inputMode="numeric" value={m.sprintNo} onChange={(e) => m.setSprintNo(sanitizeIntegerInput(e.target.value))} placeholder="örn: 7" />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">Dönem başlangıcı</div>
            <input type="date" value={m.period.periodStart} onChange={(e) => m.setPeriod((p) => ({ ...p, periodStart: e.target.value }))} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">Dönem bitişi</div>
            <input type="date" value={m.period.periodEnd} onChange={(e) => m.setPeriod((p) => ({ ...p, periodEnd: e.target.value }))} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">Rapor tarihi</div>
            <input type="date" value={m.period.reportDate} onChange={(e) => m.setPeriod((p) => ({ ...p, reportDate: e.target.value }))} />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">
              Bakım/SR oranı <span className="opt">örn: 0.2 = %20</span>
            </div>
            <input inputMode="decimal" value={m.maintenanceAllocationPercent} onChange={(e) => m.setMaintenanceAllocationPercent(sanitizeRatioInput(e.target.value))} placeholder="0.2" />
          </div>
          <div className="premium-tile premium-tile-compact" onClick={focusTileField}>
            <div className="premium-tile-label">
              Önceki rapor tarihi <span className="opt">opsiyonel · Kapanan/Eklenen için</span>
            </div>
            <input type="date" value={m.previousSnapshotDate} onChange={(e) => m.setPreviousSnapshotDate(e.target.value)} />
          </div>
        </div>
        <div className="mhint">
          Önceki rapor tarihini girersen <b>Dönem Kapanan / Yeni Eklenen / Net Değişim</b> otomatik hesaplanır (iş
          kalemlerindeki eklenme/kapanma tarihlerine göre) — elle girmen gerekmez. Boş bırakırsan bu kart görünmez.
        </div>
      </div>

      <CustomKpiEditor kpis={m.customKpis} onAdd={m.addCustomKpi} onUpdate={m.updateCustomKpi} onRemove={m.removeCustomKpi} hasFte={m.hasFte} />

      <p className="panelttl">Ekip üyeleri ve iş kalemleri</p>
      {m.members.length === 0 && <div className="mhint">Henüz üye eklenmedi. Aşağıdaki butonla başla.</div>}
      <div className="mcards">
        {m.members.map((member, i) => (
          <MemberCard
            key={member.clientId}
            reportDate={m.period.reportDate}
            periodEnd={m.period.periodEnd}
            member={member}
            index={i}
            statuses={m.statuses}
            items={m.workItemsByMember[member.clientId] || []}
            onUpdateMember={(patch) => m.updateMember(member.clientId, patch)}
            onRemoveMember={() => m.removeMember(member.clientId)}
            onAddItem={() => m.addWorkItem(member.clientId)}
            onUpdateItem={m.updateWorkItem}
            onRemoveItem={m.removeWorkItem}
            teamId={teamId}
          />
        ))}
      </div>
      <button type="button" className="premium-add-btn" onClick={m.addMember} style={{ marginTop: 12 }}>
        <IconPlusCircle className="add-btn-icon" />
        Ekip üyesi ekle
      </button>

      {m.error && <ErrorBanner error={m.error} />}

      <div style={{ marginTop: 14 }}>
        <Button variant="primary" loading={m.loading} loadingLabel="Hesaplanıyor…" onClick={m.compute}>
          Hesapla
        </Button>
      </div>

      <AlertModal
        open={!!m.alertMessage}
        title={m.alertTitle}
        message={m.alertMessage}
        onClose={m.clearAlert}
      />
    </>
  );
}
