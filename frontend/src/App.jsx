import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./styles/app.css";
import "./styles/theme.css";

import { fetchCurrentUser, fetchUserProfile, fetchPresentation, logout, savePresentation, recordPresentationDownload } from "./lib/apiClient";
import LoginPage from "./components/shared/LoginPage";
import ProfilePage from "./components/shared/ProfilePage";
import AdminHomePage from "./components/shared/AdminHomePage";
import PresentationsPage from "./components/shared/PresentationsPage";
import JointPresentationPage from "./components/shared/JointPresentationPage";
import TopBar from "./components/shared/TopBar";
import ZoomModal from "./components/shared/ZoomModal";
import ExportPreviewModal from "./components/shared/ExportPreviewModal";
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

import { sectionDefs, SECTION_KEYS } from "./lib/geometry";
import { buildFullDeck } from "./lib/fullDeckBuilder";
import { ASSETS } from "./assets/pptxAssets";
import { hasFteTracking, resolveIsAdmin, resolveTeamTypeFromDepartment } from "./lib/teamTypes";

// ZoomModal ("⤢ Preview") ve ExportPreviewModal ("PPTX İndir" oncesi onizleme)
// AYNI 3 sekmeyi kullanir - tek yerden tanimlanir.
const PREVIEW_TABS = [
  { key: "cover", label: "Kapak" },
  { key: "content", label: "İçerik Slaytı" },
  { key: "dashboard", label: "Kapasite Dashboard" },
];

/**
 * Giris durumunu yonetir - girmeden once sadece LoginPage, girince ana
 * uygulama (MainApp) render edilir. Iki farkli bilesen olarak ayrildi ki
 * hook sayisi/sirasi render'lar arasinda tutarli kalsin (Rules of Hooks) -
 * ayni bilesen icinde erken "return" ile kalan hook'lari atlamak gecersizdi.
 *
 * Sayfa yenilendiginde acilista /api/auth/me ile mevcut oturum (access_token
 * cookie'si hala gecerliyse) geri kurulur - kullanici her yenilemede tekrar
 * login olmak zorunda kalmaz.
 */
export default function App() {
  const [personnel, setPersonnel] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchCurrentUser()
      .then(setPersonnel)
      .finally(() => setSessionChecked(true));
  }, []);

  // /api/auth/me bilerek hafif (department icermez, bkz. apiClient.js) - takim
  // bazli duzenleme yetkisi kontrolu (bkz. MainApp/currentUser) icin gereken
  // department bilgisini, oturum kurulduktan sonra bir kere /profile'dan
  // ayrica cekip personnel'e ekliyoruz. Basarisiz olursa sessizce yutulur -
  // department yoksa MainApp zaten kisitlama uygulamiyor (fail-open).
  useEffect(() => {
    if (!personnel || personnel.department !== undefined) return;
    fetchUserProfile()
      .then((profile) => setPersonnel((prev) => (prev ? { ...prev, department: profile.department } : prev)))
      .catch(() => {});
  }, [personnel]);

  const handleLogout = () => {
    logout().finally(() => setPersonnel(null));
  };

  if (!sessionChecked) return null;

  const isAdmin = resolveIsAdmin(personnel);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/profile"
          element={
            personnel ? (
              <ProfilePage personnel={personnel} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin"
          element={
            personnel && isAdmin ? (
              <AdminHomePage personnel={personnel} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/presentations"
          element={
            personnel ? (
              <PresentationsPage personnel={personnel} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/ortak-sunum"
          element={
            personnel ? (
              <JointPresentationPage personnel={personnel} theme={theme} onToggleTheme={toggleTheme} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/editor/new"
          element={personnel ? <EditorForNew theme={theme} toggleTheme={toggleTheme} personnel={personnel} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/editor/:id"
          element={personnel ? <EditorForExisting theme={theme} toggleTheme={toggleTheme} personnel={personnel} /> : <Navigate to="/" replace />}
        />
        <Route
          path="/"
          element={
            !personnel ? (
              <LoginPage onLogin={setPersonnel} theme={theme} onToggleTheme={toggleTheme} />
            ) : isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <MainApp theme={theme} toggleTheme={toggleTheme} personnel={personnel} />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** `/editor/:id` - var olan bir sunumu yukleyip duzenlemeye acar. */
function EditorForExisting({ theme, toggleTheme, personnel }) {
  const { id } = useParams();
  return <MainApp theme={theme} toggleTheme={toggleTheme} personnel={personnel} presentationId={Number(id)} />;
}

/** `/editor/new?teamId=X` - admin'in "Yeni Sunum" ile actigi bos sihirbaz. */
function EditorForNew({ theme, toggleTheme, personnel }) {
  const [params] = useSearchParams();
  const teamId = params.get("teamId");
  return <MainApp theme={theme} toggleTheme={toggleTheme} personnel={personnel} newForTeamId={teamId ? Number(teamId) : null} />;
}

function MainApp({ theme, toggleTheme, personnel, presentationId, newForTeamId }) {
  // "mode/step" ayni degisken: hem ust nav hem sihirbaz adimi olarak kullanilir.
  const [mode, setMode] = useState("cover");
  const navigate = useNavigate();
  // PPTX ciktisinin acik/koyu temasi - varsayilan olarak uygulama temasiyla
  // baslar, ama kullanici site uzerinden bagimsiz secebilir (yonetici istegi).
  const [pptxTheme, setPptxTheme] = useState(theme);

  // Login yanitindaki (bkz. LoginPage.jsx/apiClient.fetchCurrentUser -
  // su an {sicil, fullName, role, teamId} doner) "role" alanindan admin
  // durumunu, "department"tan (ileride eklenecek AD/personel entegrasyonuyla
  // gelecek - bkz. AuthUser.java) takimini cozumler. Admin her takimi
  // duzenleyebilir; digerleri SADECE kendi takimlarini (roller arasinda
  // simdilik yalnizca PO ele aliniyor) - baska bir takim secilirse asagidaki
  // canEdit false olur ve ilgili adimin parametre alani yerine ReadOnlyNotice
  // gosterilir. department henuz backend yanitinda yoksa (bkz. UserResponse.java)
  // kisitlama uygulanmaz (fail-open) - kimin hangi takimda oldugu bilinmeden
  // herkesi salt-okunura dusurmek yanlis olur.
  const currentUser = useMemo(() => {
    if (!personnel) return { teamType: null, admin: true, department: null };
    const department = personnel.department || "";
    return { teamType: resolveTeamTypeFromDepartment(department), admin: resolveIsAdmin(personnel), department };
  }, [personnel]);

  // ---- Kapak (1. adim) durumu ----
  const cover = useCoverImage(ASSETS.cover_bg);

  // ---- Sprint (2. adim) durumu ----
  const sprintForm = useSprintForm();
  const canEdit = currentUser.admin || currentUser.teamType == null || currentUser.teamType === sprintForm.teamType;
  const band = useBandEditor();
  const excel = useExcelSuggestions();
  const [editorKey, setEditorKey] = useState(null);
  const handleSectionTextChange = (key, text) => {
    sprintForm.setSectionText(key, text);
  };

  // Excel'in "Rapor" sayfasi Hedefler bandini besleyecek gercek veriyi icerir
  // (FTE Gerçekleşen/Kalan, Canlı/Kalan Süreç Sayısı - bkz. excelParsers.js/
  // parseBandTargets). Excel yuklendiginde bulunursa bant otomatik doldurulur.
  useEffect(() => {
    if (excel.bandTargets.length) band.setSample(excel.bandTargets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excel.bandTargets]);

  // ---- Kapasite Dashboard (3. adim) durumu ----
  const [dashSource, setDashSource] = useState("excel");
  const dashboard = useDashboardData(sprintForm.team, sprintForm.setTeam, sprintForm.sprint, sprintForm.setSprint, sprintForm.teamType);
  const manual = useManualDashboard(sprintForm.team, sprintForm.setTeam, sprintForm.sprint, sprintForm.setSprint, sprintForm.teamType);
  // loadedDashData: /editor/:id ile acilan kayitli bir sunumun son kaydedilen
  // dashboard KPI'lari - kullanici bu oturumda Excel yuklemedigi/manuel
  // girmedigi surece onizleme/export bunu kullanir (asagidaki hidrasyon
  // effect'i doldurur). Yeni Excel yuklenir yuklenmez dashboard.dashData
  // devreye girip bunun onune gecer.
  const [loadedDashData, setLoadedDashData] = useState(null);
  const activeDashData = dashSource === "manual" ? manual.dashData : (dashboard.dashData || loadedDashData);

  // ---- Kayitli sunum yukleme (/editor/:id) + kaydetme hedefi ----
  // Ham state'i birebir yansitan "content" sekli (bkz. plan dokumani) hem
  // hidrasyonda hem kaydetmede kullanilir - simetrik olmasi, kaydet->yukle
  // dongusunun kayipsiz calismasini saglar.
  const [presentationMeta, setPresentationMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: null });
  const saveTeamId = presentationMeta?.teamId ?? newForTeamId ?? personnel?.teamId ?? null;

  useEffect(() => {
    if (!presentationId) return;
    setLoadError(null);
    fetchPresentation(presentationId)
      .then((p) => {
        const c = p.content || {};
        if (c.teamType) sprintForm.setTeamType(c.teamType);
        if (c.sprint) sprintForm.setSprint(c.sprint);
        if (c.range) sprintForm.setRange(c.range);
        if (c.sections) {
          Object.entries(c.sections).forEach(([key, text]) => sprintForm.setSectionText(key, text || ""));
        }
        if (c.band?.bars?.length) band.setSample(c.band.bars);
        if (c.band && c.band.show === false) band.toggleShow(false);
        if (c.dashSource) setDashSource(c.dashSource);
        if (c.dashData) setLoadedDashData(c.dashData);
        setPresentationMeta({ id: p.id, teamId: p.teamId, sprintNo: p.sprintNo, currentVersion: p.currentVersion });
      })
      .catch((err) => setLoadError(err?.message || "Sunum yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId]);

  const handleSave = async () => {
    if (!saveTeamId) {
      setWizardAlert("Kaydetmek için bir takım belirlenemedi.");
      return;
    }
    if (!sprintForm.sprint.trim()) {
      setWizardAlert("Kaydetmek için Sprint No boş bırakılamaz.");
      return;
    }
    setSaveStatus({ loading: true, error: null });
    try {
      const content = {
        teamType: sprintForm.teamType,
        sprint: sprintForm.sprint,
        range: sprintForm.range,
        sections: sprintForm.sections,
        band: { show: band.show, bars: band.bars },
        dashSource,
        dashData: activeDashData,
      };
      const saved = await savePresentation({
        teamId: saveTeamId, sprintNo: sprintForm.sprint, dateRange: sprintForm.range, content,
      });
      setPresentationMeta({ id: saved.id, teamId: saved.teamId, sprintNo: saved.sprintNo, currentVersion: saved.currentVersion });
      setSaveStatus({ loading: false, error: null });
    } catch (err) {
      setSaveStatus({ loading: false, error: err?.message || "Kaydedilemedi." });
    }
  };

  // Kapak + icerik + kapasite dashboard'u TEK pptx olarak indiren, sihirbazin
  // her adimindan erisilebilen ortak export (bkz. buildFullDeck).
  const fullExport = usePptxExport();

  // ---- Birlesik onizleme (kapak / icerik / kapasite dashboard) ----
  const [previewTab, setPreviewTab] = useState("cover");
  const [zoomOpen, setZoomOpen] = useState(false);
  // "PPTX İndir"e basildiginda dosya HEMEN inmez - once bu onizleme popup'u
  // acilir (tema secenegiyle), kullanici gozden gecirip asil indirmeyi
  // popup icindeki butonla onaylar (bkz. ExportPreviewModal).
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);

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
    // Daha once elle girilmis olabilecek veri (icerik bolumleri + kapasite
    // manuel giris) yeni yuklenen Excel'in verisiyle CELISMESIN/karisik
    // gorunmesin diye temizlenir - bkz. kullanici bildirimi.
    if (SECTION_KEYS.some((k) => sprintForm.sections[k]?.trim())) {
      SECTION_KEYS.forEach((k) => sprintForm.setSectionText(k, ""));
    }
    if (manual.members.length || manual.workItems.length) {
      manual.clearEntries();
    }
    setDashSource("excel");
    excel.loadFile(file, sprintForm.team, applyExcelMeta);
    dashboard.loadFile(file, applyExcelMeta);
    setExcelFileName(file.name);
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
      const pptx = buildFullDeck(data, activeDashData, assets, pptxTheme);
      const sp = (sprintForm.sprint.trim() || "X").replace(/[^\w]/g, "");
      await pptx.writeFile({ fileName: `Sprint_Kapasite_${sp}.pptx` });
      if (saveTeamId) {
        recordPresentationDownload("INDIVIDUAL", [saveTeamId]).catch(() => {
          // indirme kaydi best-effort - basarisiz olsa da kullaniciyi engellemez
        });
      }
    });

  const sprintData = { ...sprintForm.data, showBand: band.show, targets: band.bars };

  // ZoomModal ve ExportPreviewModal'in ikisi de aktif sekmeye gore AYNI tuvali
  // (dashboard veya kapak/icerik) cizer - tek yerden tanimlanip ikisine de
  // gecirilir (bkz. asagidaki renderCanvas prop'lari).
  const renderPreviewCanvas = (scale) =>
    previewTab === "dashboard" ? (
      <DashboardSlideCanvas dd={activeDashData || {}} assets={assets} scale={scale} />
    ) : (
      <SlideCanvas data={sprintData} tab={previewTab} assets={assets} scale={scale} />
    );

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
              onGenerate={() => setExportPreviewOpen(true)}
              generating={fullExport.loading}
              onSave={canEdit ? handleSave : null}
              saving={saveStatus.loading}
            />
          ) : (
            <DashboardTopActions
              onExcelFile={handleExcelFile}
              excelLoading={dashboard.loading}
              onGenerate={() => setExportPreviewOpen(true)}
              generating={fullExport.loading}
              onSave={canEdit ? handleSave : null}
              saving={saveStatus.loading}
            />
          )
        }
      />

      <ErrorBanner
        error={fullExport.error || loadError || saveStatus.error}
        onDismiss={() => {
          fullExport.setError(null);
          setLoadError(null);
          setSaveStatus((s) => ({ ...s, error: null }));
        }}
      />
      {presentationMeta && !saveStatus.error && (
        <div style={{ margin: "0 22px 10px", fontSize: 12.5, color: "var(--mut)" }}>
          ✓ Kaydedildi (v{presentationMeta.currentVersion})
        </div>
      )}

      <WizardSteps step={mode} onStepChange={changeMode} onBack={(presentationId || newForTeamId) ? () => navigate(-1) : null} />

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
        tabs={PREVIEW_TABS}
        activeTab={previewTab}
        onTabChange={setPreviewTab}
        renderCanvas={renderPreviewCanvas}
      />

      <ExportPreviewModal
        open={exportPreviewOpen}
        onClose={() => setExportPreviewOpen(false)}
        tabs={PREVIEW_TABS}
        activeTab={previewTab}
        onTabChange={setPreviewTab}
        renderCanvas={renderPreviewCanvas}
        previewTheme={pptxTheme}
        onPreviewThemeChange={setPptxTheme}
        downloading={fullExport.loading}
        onConfirmDownload={async () => {
          const ok = await handleGenerateFullDeck();
          if (ok) setExportPreviewOpen(false);
        }}
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
