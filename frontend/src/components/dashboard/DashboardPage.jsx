import DashboardMetaForm from "./DashboardMetaForm";
import PersonMappingTable from "./PersonMappingTable";
import DeltaForm from "./DeltaForm";
import DashboardSlideCanvas from "./DashboardSlideCanvas";
import ManualDashboardForm from "./ManualDashboardForm";
import ErrorBanner from "../shared/ErrorBanner";
import Button from "../shared/Button";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * Kapasite Dashboard modu: solda veri girisi (Excel'den Yukle veya Manuel Gir),
 * sagda canli onizleme. Orijinal HTML'deki <main id="dashMode"> tasarimini korur,
 * ustune veri kaynagi secimi (source toggle) eklenmistir.
 */
export default function DashboardPage({ visible, source, onSourceChange, dashboard, manual, assets, onZoom }) {
  const { boxRef, scale } = useCanvasFit();
  const activeData = source === "manual" ? manual.dashData : dashboard.dashData;

  return (
    <main className={visible ? "" : "hidden"}>
      <section>
        <div className="tabs">
          <button type="button" className={`tab${source === "excel" ? " active" : ""}`} onClick={() => onSourceChange("excel")}>
            Excel'den Yükle
          </button>
          <button type="button" className={`tab${source === "manual" ? " active" : ""}`} onClick={() => onSourceChange("manual")}>
            Manuel Gir
          </button>
        </div>

        {source === "excel" ? (
          <>
            <div className="bandpanel">
              <div className="dashinfo">{dashboard.loading ? "Excel okunuyor…" : dashboard.info}</div>
            </div>
            {dashboard.error && <ErrorBanner error={dashboard.error} />}
            <DashboardMetaForm dTeam={dashboard.dTeam} setDTeam={dashboard.setDTeam} dSprint={dashboard.dSprint} setDSprint={dashboard.setDSprint} />
            <p className="panelttl">Kişi eşleme — ad / rol / kısaltma</p>
            <PersonMappingTable persons={dashboard.persons} onUpdate={dashboard.updatePerson} />
            <DeltaForm
              dKapanan={dashboard.dKapanan} setDKapanan={dashboard.setDKapanan}
              dEklenen={dashboard.dEklenen} setDEklenen={dashboard.setDEklenen}
              dFte={dashboard.dFte} setDFte={dashboard.setDFte}
              dNet={dashboard.dNet} setDNet={dashboard.setDNet}
            />
          </>
        ) : (
          <ManualDashboardForm m={manual} />
        )}
      </section>
      <section className="previewwrap">
        <p className="panelttl">Dashboard önizleme</p>
        <div className="stage">
          <div className="tabs">
            <Button variant="soft" className="tab zoomtrig" title="Önizlemeyi büyüt" onClick={onZoom}>
              ⤢ Büyüt
            </Button>
          </div>
          <div className="slidebox" ref={boxRef}>
            <DashboardSlideCanvas dd={activeData || {}} assets={assets} scale={scale} />
          </div>
          <div className="note">
            {source === "excel"
              ? <>Excel'deki <b>aynı formüllerle</b> üretilir. Kişi ad/rol bilgisini yukarıdan düzenleyebilirsiniz.</>
              : <>Girdiğin veriler <b>hiçbir yere kaydedilmeden</b>, backend tarafından anında hesaplanır.</>}
          </div>
        </div>
      </section>
    </main>
  );
}
