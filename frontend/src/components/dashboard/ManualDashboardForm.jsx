import Button from "../shared/Button";
import ErrorBanner from "../shared/ErrorBanner";
import AlertModal from "../shared/AlertModal";
import StatusEditor from "./StatusEditor";
import CustomKpiEditor from "./CustomKpiEditor";
import MemberCard from "./MemberCard";
import { sanitizeIntegerInput, sanitizeRatioInput } from "../../lib/format";

/**
 * Kapasite Dashboard'un "Manuel Gir" modu: Excel gerekmeden, ekip uyesi ve is
 * kalemi formlariyla veri girip backend'in stateless endpoint'ine hesaplatir.
 * Hicbir sey kaydedilmez (Pressman - System Response Time: hesaplama sirasinda
 * "Hesapla" butonu disable olup "Hesaplanıyor…" gosterir).
 */
export default function ManualDashboardForm({ m, teamId }) {
  return (
    <>
      <div className="bandpanel">
        <div className="deltagrid">
          <div className="field">
            <label>Ekip adı</label>
            <input value={m.team} onChange={(e) => m.setTeam(e.target.value)} placeholder="örn: RPA Ekibi" />
          </div>
          <div className="field">
            <label>
              Sprint No <span className="opt">opsiyonel</span>
            </label>
            <input inputMode="numeric" value={m.sprintNo} onChange={(e) => m.setSprintNo(sanitizeIntegerInput(e.target.value))} placeholder="örn: 7" />
          </div>
          <div className="field">
            <label>Dönem başlangıcı</label>
            <input type="date" value={m.period.periodStart} onChange={(e) => m.setPeriod((p) => ({ ...p, periodStart: e.target.value }))} />
          </div>
          <div className="field">
            <label>Dönem bitişi</label>
            <input type="date" value={m.period.periodEnd} onChange={(e) => m.setPeriod((p) => ({ ...p, periodEnd: e.target.value }))} />
          </div>
          <div className="field">
            <label>Rapor tarihi</label>
            <input type="date" value={m.period.reportDate} onChange={(e) => m.setPeriod((p) => ({ ...p, reportDate: e.target.value }))} />
          </div>
          <div className="field">
            <label>
              Bakım/SR oranı <span className="opt">örn: 0.2 = %20</span>
            </label>
            <input inputMode="decimal" value={m.maintenanceAllocationPercent} onChange={(e) => m.setMaintenanceAllocationPercent(sanitizeRatioInput(e.target.value))} placeholder="0.2" />
          </div>
          <div className="field">
            <label>
              Önceki rapor tarihi <span className="opt">opsiyonel · Kapanan/Eklenen için</span>
            </label>
            <input type="date" value={m.previousSnapshotDate} onChange={(e) => m.setPreviousSnapshotDate(e.target.value)} />
          </div>
        </div>
        <div className="mhint">
          Önceki rapor tarihini girersen <b>Dönem Kapanan / Yeni Eklenen / Net Değişim</b> otomatik hesaplanır (iş
          kalemlerindeki eklenme/kapanma tarihlerine göre) — elle girmen gerekmez. Boş bırakırsan bu kart görünmez.
        </div>
      </div>

      <StatusEditor statuses={m.statuses} onAdd={m.addStatus} onUpdate={m.updateStatus} onRemove={m.removeStatus} />

      <CustomKpiEditor kpis={m.customKpis} onAdd={m.addCustomKpi} onUpdate={m.updateCustomKpi} onRemove={m.removeCustomKpi} hasFte={m.hasFte} />

      <p className="panelttl">Ekip üyeleri ve iş kalemleri</p>
      {m.members.length === 0 && <div className="mhint">Henüz üye eklenmedi. Aşağıdaki butonla başla.</div>}
      {m.members.map((member) => (
        <MemberCard
          key={member.clientId}
          member={member}
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
      <Button variant="soft" onClick={m.addMember} style={{ marginTop: 8 }}>
        + Ekip üyesi ekle
      </Button>

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
