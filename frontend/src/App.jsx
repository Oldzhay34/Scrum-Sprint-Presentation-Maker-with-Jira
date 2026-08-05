import { useEffect, useMemo, useState } from "react";
import "./styles/app.css";
import "./styles/theme.css";

import LoginPage from "./components/shared/LoginPage";
import TopBar from "./components/shared/TopBar";
import ZoomModal from "./components/shared/ZoomModal";
import ErrorBanner from "./components/shared/ErrorBanner";
import WizardSteps from "./components/shared/WizardSteps";
import UnifiedPreviewPane from "./components/shared/UnifiedPreviewPane";
import Button from "./components/shared/Button";
import AlertModal from "./components/shared/AlertModal";
import ReadOnlyNotice from "./components/shared/ReadOnlyNotice";

import SprintPage from "./components/sprint/SprintPage";
import SprintTopActions from "./components/sprint/SprintTopActions";
import EditorModal from "./components/sprint/EditorModal";
import SlideCanvas from "./components/sprint/SlideCanvas";
import CoverPage from "./components/sprint/CoverPage";

import DashboardPage from "./components/dashboard/DashboardPage";
import DashboardTopActions from "./components/dashboard/DashboardTopActions";
import DashboardSlideCanvas from "./components/dashboard/DashboardSlideCanvas";

import { useSprintForm } from "./hooks/useSprintForm";
import { useBandEditor } from "./hooks/useBandEditor";
import { useExcelSuggestions } from "./hooks/useExcelSuggestions";
import { usePptxExport } from "./hooks/usePptxExport";
import { useDashboardData } from "./hooks/useDashboardData";
import { useManualDashboard } from "./hooks/useManualDashboard";
import { useTheme } from "./hooks/useTheme";
import { useCoverImage } from "./hooks/useCoverImage";

import { sectionDefs } from "./lib/geometry";
import { buildFullDeck } from "./lib/fullDeckBuilder";
import { ASSETS } from "./assets/pptxAssets";
import { hasFteTracking, resolveTeamTypeFromDepartment } from "./lib/teamTypes";

const SAMPLE_BAND_BARS = [
  { label: "HEDEFLER", segments: [{ value: "17", color: "green" }, { value: "33", color: "blue" }] },
  { label: "FTE", segments: [{ value: "1.31", color: "green" }, { value: "24.39", color: "blue" }] },
];

// GECICI: backend /api/auth/login hazir olana kadar login ekrani atlaniyor.
// Endpoint hazir olunca bu satiri (ve asagidaki "|| SKIP_LOGIN" kosulunu) kaldir.
const SKIP_LOGIN = true;

/**
 * Giris durumunu yonetir - girmeden once sadece LoginPage, girince ana
 * uygulama (MainApp) render edilir. Iki farkli bilesen olarak ayrildi ki
 * hook sayisi/sirasi render'lar arasinda tutarli kalsin (Rules of Hooks) -
 * ayni bilesen icinde erken "return" ile kalan hook'lari atlamak gecersizdi.
 */
export default function App() {
  const [personnel, setPersonnel] = useState(null);
  const { theme, toggleTheme } = useTheme();

  if (!personnel && !SKIP_LOGIN) {
    return <LoginPage onLogin={setPersonnel} theme={theme} onToggleTheme={toggleTheme} />;
  }
  return <MainApp theme={theme} toggleTheme={toggleTheme} personnel={personnel} />;
}

function MainApp({ theme, toggleTheme, personnel }) {
  // "mode/step" ayni degisken: hem ust nav hem sihirbaz adimi olarak kullanilir.
  const [mode, setMode] = useState("cover");

  // Login yanitindaki (bkz. LoginPage.jsx/apiClient.login) department/roles
  // alanlarindan kullanicinin takimini ve admin durumunu cozumler. personnel
  // yoksa (SKIP_LOGIN gecici atlamasi) kisitlama uygulanmaz - gercek login
  // devreye girince otomatik calismaya baslar. Admin her takimi duzenleyebilir;
  // digerleri SADECE kendi takimlarini (roller arasinda simdilik yalnizca PO
  // ele aliniyor) - baska bir takim secilirse asagidaki canEdit false olur ve
  // ilgili adimin parametre alani yerine ReadOnlyNotice gosterilir.
  const currentUser = useMemo(() => {
    if (!personnel) return { teamType: null, admin: true, department: null };
    const department = personnel.department || "";
    const roles = personnel.roles || [];
    const admin = Array.isArray(roles)
      ? roles.includes("ADMIN")
      : String(roles || "").toUpperCase().includes("ADMIN");
    return { teamType: resolveTeamTypeFromDepartment(department), admin, department };
  }, [personnel]);

  // ---- Kapak (1. adim) durumu ----
  const cover = useCoverImage(ASSETS.cover_bg);

  // ---- Sprint (2. adim) durumu ----
  const sprintForm = useSprintForm();
  const canEdit = currentUser.admin || currentUser.teamType == null || currentUser.teamType === sprintForm.teamType;
  const band = useBandEditor();
  const excel = useExcelSuggestions();
  const [editorKey, setEditorKey] = useState(null);
  // "Örnek Doldur" ile gelen bolum metinleri (Gecen Sprint/Aktif/Riskler/Bekleyen)
  // bir yer tutucudur: kullanici gercek veriye (Excel yukleyerek ya da elle
  // yazarak) gectigi an otomatik temizlenir ki ornek metinlerle gercek icerik
  // karismasin. Hedefler bandi buna dahil DEGIL - Excel bandi hic beslemiyor,
  // bu yuzden excel yuklerken bandi temizlemenin kullaniciya hicbir faydasi
  // olmaz, sadece uzerinde calistigi kurulumu sebepsiz siler.
  const [sampleFilled, setSampleFilled] = useState(false);
  const clearSampleIfNeeded = () => {
    if (!sampleFilled) return;
    sprintForm.clearSections();
    setSampleFilled(false);
  };
  const handleSectionTextChange = (key, text) => {
    clearSampleIfNeeded();
    sprintForm.setSectionText(key, text);
  };

  // Excel'in "Rapor" sayfasi Hedefler bandini besleyecek gercek veriyi icerir
  // (FTE Gerçekleşen/Kalan, Canlı/Kalan Süreç Sayısı - bkz. excelParsers.js/
  // parseBandTargets). Excel yuklendiginde bulunursa bant otomatik doldurulur,
  // "Örnek Doldur"daki sabit sayilarin yerini gercek veri alir.
  useEffect(() => {
    if (excel.bandTargets.length) band.setSample(excel.bandTargets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excel.bandTargets]);

  // ---- Kapasite Dashboard (3. adim) durumu ----
  const [dashSource, setDashSource] = useState("excel");
  const dashboard = useDashboardData(sprintForm.team, sprintForm.setTeam, sprintForm.sprint, sprintForm.setSprint, sprintForm.teamType);
  const manual = useManualDashboard(sprintForm.team, sprintForm.setTeam, sprintForm.sprint, sprintForm.setSprint, sprintForm.teamType);
  const activeDashData = dashSource === "manual" ? manual.dashData : dashboard.dashData;

  // Kapak + icerik + kapasite dashboard'u TEK pptx olarak indiren, sihirbazin
  // her adimindan erisilebilen ortak export (bkz. buildFullDeck).
  const fullExport = usePptxExport();

  // ---- Birlesik onizleme (kapak / icerik / kapasite dashboard) ----
  const [previewTab, setPreviewTab] = useState("cover");
  const [zoomOpen, setZoomOpen] = useState(false);

  // Sihirbaz adimi (mode) degistiginde onizleme sekmesi de otomatik esler -
  // "Kapak Sayfasi" adimina gecince onizleme de kapak gorselini (logo + ag deseni)
  // gostersin, kullanici ayrica sekme tiklamak zorunda kalmasin.
  const MODE_TO_PREVIEW_TAB = { cover: "cover", sprint: "content", dash: "dashboard" };
  const [wizardAlert, setWizardAlert] = useState(null);
  const changeMode = (newMode) => {
    if (mode === "cover" && newMode !== "cover" && canEdit && !sprintForm.sprint.trim()) {
      setWizardAlert("Sprint No boş bırakılamaz.");
      return;
    }
    setMode(newMode);
    setPreviewTab(MODE_TO_PREVIEW_TAB[newMode]);
  };

  // Kapak gorseli kullanicidan gelmisse ASSETS'in uzerine yazilir - SlideCanvas,
  // DashboardSlideCanvas ve buildFullDeck bunu degistirmeden ayni sekilde tuketir.
  const assets = { ...ASSETS, cover_bg: cover.coverBg };
  const SEC = sectionDefs(assets);

  // Excel yukleme tek bir kaynaktan gelir: hangi sayfadan yuklenirse yuklensin
  // (Sprint veya Kapasite Dashboard), ayni dosya HER IKI sayfayi da besler -
  // standart "Kapasite Takip" dosyasi hem Is_Listesi/Parametreler hem de
  // Rapor/Kapasite sayfalarini bir arada icerir.
  const [excelFileName, setExcelFileName] = useState(null);
  // Excel'in "Parametreler" sayfasindan (Takım Adı/FTE izleri, Rapor Tarihi,
  // Sprint No) okunan takim tipi/sprint no/tarih araligi, sihirbazdaki ilgili
  // alanlari otomatik gunceller - kullanicinin ayni bilgiyi iki kez (bir Excel'e
  // bir de "Ekip adı"/"Sprint no" alanlarina) girmesine gerek kalmaz.
  const applyExcelMeta = ({ teamType, sprintNo, range } = {}) => {
    if (teamType) sprintForm.setTeamType(teamType);
    if (sprintNo) sprintForm.setSprint(sprintNo);
    if (range) sprintForm.setRange(range);
  };
  const handleExcelFile = (file) => {
    clearSampleIfNeeded();
    excel.loadFile(file, sprintForm.team, applyExcelMeta);
    dashboard.loadFile(file, applyExcelMeta);
    setExcelFileName(file.name);
  };

  const handleFillSample = () => {
    if (!window.confirm("Tüm bölümler örnek verilerle doldurulacak ve mevcut içerik değişecek. Emin misiniz?")) return;
    sprintForm.fillSample();
    const sampleBars = hasFteTracking(sprintForm.teamType)
      ? SAMPLE_BAND_BARS
      : SAMPLE_BAND_BARS.filter((b) => b.label !== "FTE");
    band.setSample(sampleBars);
    setSampleFilled(true);
  };

  const handleGenerateFullDeck = () =>
    fullExport.run(async () => {
      if (!activeDashData || !activeDashData.kpis) {
        throw new Error(
          dashSource === "manual"
            ? "Kapasite Dashboard adımında önce verileri girip Hesapla'ya basın."
            : "Kapasite Dashboard adımında önce Excel yükleyin."
        );
      }
      const data = { ...sprintForm.data, showBand: band.show, targets: band.bars };
      const pptx = buildFullDeck(data, activeDashData, assets);
      const sp = (sprintForm.sprint.trim() || "X").replace(/[^\w]/g, "");
      await pptx.writeFile({ fileName: `Sprint_Kapasite_${sp}.pptx` });
    });

  const sprintData = { ...sprintForm.data, showBand: band.show, targets: band.bars };

  return (
    <>
      <TopBar
        theme={theme}
        onToggleTheme={toggleTheme}
        excelFileName={excelFileName}
        personnel={personnel}
        actions={
          mode === "cover" || mode === "sprint" ? (
            <SprintTopActions
              onExcelFile={handleExcelFile}
              excelLoading={excel.loading}
              onFillSample={handleFillSample}
              onGenerate={handleGenerateFullDeck}
              generating={fullExport.loading}
            />
          ) : (
            <DashboardTopActions
              onExcelFile={handleExcelFile}
              excelLoading={dashboard.loading}
              onGenerate={handleGenerateFullDeck}
              generating={fullExport.loading}
            />
          )
        }
      />

      <ErrorBanner error={fullExport.error} onDismiss={() => fullExport.setError(null)} />

      <WizardSteps step={mode} onStepChange={changeMode} />

      <main>
        <div className="wizard-col">
          {mode === "cover" && (
            <CoverPage
              teamType={sprintForm.teamType} setTeamType={sprintForm.setTeamType}
              sprint={sprintForm.sprint} setSprint={sprintForm.setSprint}
              range={sprintForm.range} setRange={sprintForm.setRange}
              cover={cover}
              canEdit={canEdit}
            />
          )}
          {mode === "sprint" && (
            canEdit ? (
              <SprintPage
                form={{ ...sprintForm, setSectionText: handleSectionTextChange }}
                band={band}
                excel={excel}
                assets={assets}
                onExpandSection={setEditorKey}
              />
            ) : (
              <ReadOnlyNotice teamType={sprintForm.teamType} />
            )
          )}
          {mode === "dash" && (
            canEdit ? (
              <DashboardPage source={dashSource} onSourceChange={setDashSource} dashboard={dashboard} manual={manual} />
            ) : (
              <ReadOnlyNotice teamType={sprintForm.teamType} />
            )
          )}
          <div className="wizard-nav">
            <Button variant="soft" disabled={mode === "cover"} onClick={() => changeMode(mode === "dash" ? "sprint" : "cover")}>
              {mode === "dash" ? "← Geri: İçerik Slaytı" : "← Geri: Kapak Sayfası"}
            </Button>
            <Button variant="primary" disabled={mode === "dash"} onClick={() => changeMode(mode === "cover" ? "sprint" : "dash")}>
              {mode === "cover" ? "İleri: İçerik Slaytı →" : "İleri: Kapasite Dashboard →"}
            </Button>
          </div>
        </div>

        <UnifiedPreviewPane
          sprintData={sprintData}
          dashData={activeDashData}
          assets={assets}
          activeTab={previewTab}
          onTabChange={setPreviewTab}
          onZoom={() => setZoomOpen(true)}
        />
      </main>

      <EditorModal
        open={editorKey != null}
        sectionKey={editorKey}
        def={editorKey ? SEC[editorKey] : null}
        text={editorKey ? sprintForm.sections[editorKey] : ""}
        onChange={(text) => editorKey && handleSectionTextChange(editorKey, text)}
        onClose={() => setEditorKey(null)}
      />

      <ZoomModal
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        tabs={[
          { key: "cover", label: "Kapak" },
          { key: "content", label: "İçerik Slaytı" },
          { key: "dashboard", label: "Kapasite Dashboard" },
        ]}
        activeTab={previewTab}
        onTabChange={setPreviewTab}
        renderCanvas={(scale) =>
          previewTab === "dashboard" ? (
            <DashboardSlideCanvas dd={activeDashData || {}} assets={assets} scale={scale} />
          ) : (
            <SlideCanvas
              data={sprintData}
              tab={previewTab}
              assets={assets}
              scale={scale}
            />
          )
        }
      />

      <AlertModal
        open={!!wizardAlert}
        title="Eksik bilgi"
        message={wizardAlert}
        onClose={() => setWizardAlert(null)}
      />
    </>
  );
}
