import DashboardMetaForm from "./DashboardMetaForm";
import PersonMappingTable from "./PersonMappingTable";
import DeltaForm from "./DeltaForm";
import DashboardSlideCanvas from "./DashboardSlideCanvas";
import ErrorBanner from "../shared/ErrorBanner";
import Button from "../shared/Button";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * Kapasite Dashboard modu: solda Excel'den gelen/duzenlenebilir veriler,
 * sagda canli onizleme. Orijinal HTML'deki <main id="dashMode"> ile birebir aynidir.
 */
export default function DashboardPage({ visible, dashboard, assets, onZoom }) {
  const { boxRef, scale } = useCanvasFit();

  return (
    <main className={visible ? "" : "hidden"}>
      <section>
        <div className="bandpanel">
          <div className="dashinfo">
            {dashboard.loading ? "Excel okunuyor…" : dashboard.info}
          </div>
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
            <DashboardSlideCanvas dd={dashboard.dashData} assets={assets} scale={scale} />
          </div>
          <div className="note">
            Excel'deki <b>aynı formüllerle</b> üretilir. Kişi ad/rol bilgisini yukarıdan düzenleyebilirsiniz.
          </div>
        </div>
      </section>
    </main>
  );
}
