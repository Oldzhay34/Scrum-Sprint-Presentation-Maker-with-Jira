import DashboardMetaForm from "./DashboardMetaForm";
import PersonMappingTable from "./PersonMappingTable";
import DeltaForm from "./DeltaForm";
import ManualDashboardForm from "./ManualDashboardForm";
import JiraDashboardPanel from "./JiraDashboardPanel";
import DashboardTableHeadersEditor from "./DashboardTableHeadersEditor";
import ErrorBanner from "../shared/ErrorBanner";

/**
 * Sihirbazin 2. adimi: Kapasite Dashboard veri girisi (Excel'den Yukle,
 * Manuel Gir veya Jira'dan - DB'de zaten senkronize edilmis veriyi okur).
 * Veri kaynagi sekmeleri artik BURADA degil, sagdaki "Canlı Önizleme"
 * panelinin ust cubugunda (bkz. SourceTabs.jsx, UnifiedPreviewPane.jsx) -
 * "source" prop'u yine App.jsx'teki AYNI state'ten gelir, sadece sekme UI'si
 * tasindi (bkz. kullanici bildirimi, 2026-08-17: "ilk resimde attıklarımı
 * ikinci resimdeki yere taşı"). Onizleme artik UnifiedPreviewPane icinde ayri
 * olarak yonetiliyor.
 */
export default function DashboardPage({ source, dashboard, manual, jira, teamId, tableHeaders, setTableHeaders }) {
  return (
    <section>
      <DashboardTableHeadersEditor tableHeaders={tableHeaders} setTableHeaders={setTableHeaders} />

      {source === "excel" ? (
        <>
          <div className="bandpanel">
            <div className="dashinfo">{dashboard.loading ? "Excel okunuyor…" : dashboard.info}</div>
          </div>
          {dashboard.error && <ErrorBanner error={dashboard.error} />}
          <DashboardMetaForm dTeam={dashboard.dTeam} setDTeam={dashboard.setDTeam} dSprint={dashboard.dSprint} setDSprint={dashboard.setDSprint} />
          <p className="panelttl">Kişi eşleme — ad / rol / kısaltma</p>
          <PersonMappingTable persons={dashboard.persons} onUpdate={dashboard.updatePerson} teamId={teamId} reportDate={dashboard.reportDateIso} />
          <DeltaForm
            dKapanan={dashboard.dKapanan} setDKapanan={dashboard.setDKapanan}
            dEklenen={dashboard.dEklenen} setDEklenen={dashboard.setDEklenen}
            dFte={dashboard.dFte} setDFte={dashboard.setDFte}
            dNet={dashboard.dNet} setDNet={dashboard.setDNet}
            hasFte={dashboard.hasFte}
          />
        </>
      ) : source === "manual" ? (
        <ManualDashboardForm m={manual} teamId={teamId} />
      ) : (
        <JiraDashboardPanel j={jira} />
      )}
    </section>
  );
}
