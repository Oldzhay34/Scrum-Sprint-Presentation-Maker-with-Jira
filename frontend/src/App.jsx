import { useState } from "react";
import "./styles/app.css";

import TopBar from "./components/shared/TopBar";
import ZoomModal from "./components/shared/ZoomModal";
import ErrorBanner from "./components/shared/ErrorBanner";

import SprintPage from "./components/sprint/SprintPage";
import SprintTopActions from "./components/sprint/SprintTopActions";
import EditorModal from "./components/sprint/EditorModal";
import SlideCanvas from "./components/sprint/SlideCanvas";
import MetaBar from "./components/sprint/MetaBar";

import DashboardPage from "./components/dashboard/DashboardPage";
import DashboardTopActions from "./components/dashboard/DashboardTopActions";
import DashboardSlideCanvas from "./components/dashboard/DashboardSlideCanvas";

import { useSprintForm } from "./hooks/useSprintForm";
import { useBandEditor } from "./hooks/useBandEditor";
import { useExcelSuggestions } from "./hooks/useExcelSuggestions";
import { usePptxExport } from "./hooks/usePptxExport";
import { useDashboardData } from "./hooks/useDashboardData";
import { useManualDashboard } from "./hooks/useManualDashboard";

import { sectionDefs } from "./lib/geometry";
import { buildSprintDeck } from "./lib/sprintDeckBuilder";
import { buildDashboardDeck } from "./lib/dashboardDeckBuilder";
import { ASSETS } from "./assets/pptxAssets";

const SAMPLE_BAND_BARS = [
  { label: "HEDEFLER", segments: [{ value: "17", color: "green" }, { value: "33", color: "blue" }] },
  { label: "FTE", segments: [{ value: "1.31", color: "green" }, { value: "24.39", color: "blue" }] },
];

export default function App() {
  const [mode, setMode] = useState("sprint");

  // ---- Sprint modu durumu ----
  const sprintForm = useSprintForm();
  const band = useBandEditor();
  const excel = useExcelSuggestions();
  const sprintExport = usePptxExport();
  const [curTab, setCurTab] = useState("content");
  const [editorKey, setEditorKey] = useState(null);

  // ---- Kapasite Dashboard modu durumu ----
  const [dashSource, setDashSource] = useState("excel");
  const dashboard = useDashboardData(sprintForm.team);
  const manual = useManualDashboard(sprintForm.team);
  const dashExport = usePptxExport();
  const activeDashData = dashSource === "manual" ? manual.dashData : dashboard.dashData;

  // ---- Buyutulmus onizleme (her iki modda da paylasilir) ----
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomTab, setZoomTab] = useState("content");

  const SEC = sectionDefs(ASSETS);

  const handleFillSample = () => {
    if (!window.confirm("Tüm bölümler örnek verilerle doldurulacak ve mevcut içerik değişecek. Emin misiniz?")) return;
    sprintForm.fillSample();
    band.setSample(SAMPLE_BAND_BARS);
  };

  const handleGenerateSprint = () =>
    sprintExport.run(async () => {
      const data = { ...sprintForm.data, showBand: band.show, targets: band.bars };
      const pptx = buildSprintDeck(data, ASSETS);
      const sp = (sprintForm.sprint.trim() || "X").replace(/[^\w]/g, "");
      await pptx.writeFile({ fileName: `Sprint_Sunumu_${sp}.pptx` });
    });

  const handleGenerateDashboard = () =>
    dashExport.run(async () => {
      if (!activeDashData || !activeDashData.kpis) {
        throw new Error(dashSource === "manual" ? "Önce verileri girip Hesapla'ya basın." : "Önce Excel yükleyin.");
      }
      const pptx = buildDashboardDeck(activeDashData, ASSETS);
      await pptx.writeFile({ fileName: "Kapasite_Dashboard.pptx" });
    });

  const openZoom = () => {
    setZoomTab(curTab);
    setZoomOpen(true);
  };

  const sprintZoomData = { ...sprintForm.data, showBand: band.show, targets: band.bars };

  return (
    <>
      <TopBar
        mode={mode}
        onModeChange={setMode}
        actions={
          mode === "sprint" ? (
            <SprintTopActions
              onExcelFile={excel.loadFile}
              excelLoading={excel.loading}
              onFillSample={handleFillSample}
              onGenerate={handleGenerateSprint}
              generating={sprintExport.loading}
            />
          ) : (
            <DashboardTopActions
              onExcelFile={dashboard.loadFile}
              excelLoading={dashboard.loading}
              onGenerate={handleGenerateDashboard}
              generating={dashExport.loading}
            />
          )
        }
      />

      {mode === "sprint" && <ErrorBanner error={sprintExport.error} onDismiss={() => sprintExport.setError(null)} />}
      {mode === "dash" && <ErrorBanner error={dashExport.error} onDismiss={() => dashExport.setError(null)} />}

      <MetaBar
        team={sprintForm.team} setTeam={sprintForm.setTeam}
        sprint={sprintForm.sprint} setSprint={sprintForm.setSprint}
        range={sprintForm.range} setRange={sprintForm.setRange}
        excelInfo={excel.info}
      />

      <SprintPage
        visible={mode === "sprint"}
        form={sprintForm}
        band={band}
        excel={excel}
        assets={ASSETS}
        curTab={curTab}
        onTabChange={setCurTab}
        onZoom={openZoom}
        onExpandSection={setEditorKey}
      />

      <DashboardPage
        visible={mode === "dash"}
        source={dashSource}
        onSourceChange={setDashSource}
        dashboard={dashboard}
        manual={manual}
        assets={ASSETS}
        onZoom={openZoom}
      />

      <EditorModal
        open={editorKey != null}
        sectionKey={editorKey}
        def={editorKey ? SEC[editorKey] : null}
        text={editorKey ? sprintForm.sections[editorKey] : ""}
        onChange={(text) => editorKey && sprintForm.setSectionText(editorKey, text)}
        onClose={() => setEditorKey(null)}
      />

      <ZoomModal
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        tabs={mode === "sprint" ? [{ key: "content", label: "İçerik slaytı" }, { key: "cover", label: "Kapak" }] : null}
        activeTab={zoomTab}
        onTabChange={setZoomTab}
        renderCanvas={(scale) =>
          mode === "dash" ? (
            <DashboardSlideCanvas dd={activeDashData || {}} assets={ASSETS} scale={scale} />
          ) : (
            <SlideCanvas data={sprintZoomData} tab={zoomTab} assets={ASSETS} scale={scale} />
          )
        }
      />
    </>
  );
}
