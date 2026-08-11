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
 * Onizleme artik UnifiedPreviewPane icinde ayri olarak yonetiliyor.
 */
export default function DashboardPage({ source, onSourceChange, dashboard, manual, jira, teamId, tableHeaders, setTableHeaders }) {
  return (
    <section>
      <div className="tabs">
        <button type="button" className={`tab${source === "excel" ? " active" : ""}`} onClick={() => onSourceChange("excel")}>
          Excel'den Yükle
        </button>
        <button type="button" className={`tab${source === "manual" ? " active" : ""}`} onClick={() => onSourceChange("manual")}>
          Manuel Gir
        </button>
        <button type="button" className={`tab${source === "jira" ? " active" : ""}`} onClick={() => onSourceChange("jira")}>
          Jira'dan
        </button>
      </div>

      <DashboardTableHeadersEditor tableHeaders={tableHeaders} setTableHeaders={setTableHeaders} />

      {source === "excel" ? (
        <>
          <div className="bandpanel">
            <div className="dashinfo">{dashboard.loading ? "Excel okunuyor…" : dashboard.info}</div>
          </div>
          {dashboard.error && <ErrorBanner error={dashboard.error} />}
          <DashboardMetaForm dTeam={dashboard.dTeam} setDTeam={dashboard.setDTeam} dSprint={dashboard.dSprint} setDSprint={dashboard.setDSprint} />
          <p className="panelttl">Kişi eşleme — ad / rol / kısaltma</p>
          <PersonMappingTable persons={dashboard.persons} onUpdate={dashboard.updatePerson} teamId={teamId} />
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
