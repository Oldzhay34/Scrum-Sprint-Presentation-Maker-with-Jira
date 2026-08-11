import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./styles/app.css";
import "./styles/theme.css";

import { fetchCurrentUser, fetchUserProfile, fetchPresentation, logout, savePresentation, updatePresentationInPlace, recordPresentationDownload, triggerJiraSync } from "./lib/apiClient";
import LoginPage from "./components/shared/LoginPage";
import ProfilePage from "./components/shared/ProfilePage";
import AdminHomePage from "./components/shared/AdminHomePage";
import MonitoringPage from "./components/shared/MonitoringPage";
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
import { useJiraDashboard } from "./hooks/useJiraDashboard";
import { useTheme } from "./hooks/useTheme";
import { useCoverImage } from "./hooks/useCoverImage";

import { autoApplyCompanyHolidays } from "./lib/autoApplyCompanyHolidays";
import { sectionDefs, SECTION_KEYS } from "./lib/geometry";
import { buildFullDeck } from "./lib/fullDeckBuilder";
import { ASSETS } from "./assets/pptxAssets";
import { hasFteTracking, resolveIsAdmin, resolveTeamTypeFromDepartment, resolveJiraProjectKey, teamTypeLabel } from "./lib/teamTypes";

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
              <ProfilePage
                personnel={personnel}
                theme={theme}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
                onProfileUpdated={(updated) =>
                  setPersonnel((prev) =>
                    prev
                      ? {
                          ...prev,
                          fullName: updated.fullName,
                          teamId: updated.teamId,
                          department: updated.department,
                          // Profil ekrani tek takim secimi sundugu icin kaydedince
                          // coklu takim listesi (varsa) teke duser - bkz. backend ProfileService.
                          teamIds: updated.teamId != null ? [updated.teamId] : [],
                        }
                      : prev
                  )
                }
              />
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
          path="/admin/monitoring"
          element={
            personnel && isAdmin ? (
              <MonitoringPage personnel={personnel} theme={theme} onToggleTheme={toggleTheme} />
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

/**
 * `/editor/:id` - var olan bir sunumu yukleyip duzenlemeye acar.
 * "?fromJoint=1" ise Ortak Sunum ekranindaki "Düzenle"den gelindigini
 * isaretler (bkz. JointPresentationPage.handleEditTeam) - MainApp bu durumda
 * normal "Kaydet" (yeni surum ekler) yaninda bir de "Güncelle" (mevcut
 * surumu YERINDE degistirir) butonu gosterir.
 */
function EditorForExisting({ theme, toggleTheme, personnel }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  return (
    <MainApp
      theme={theme}
      toggleTheme={toggleTheme}
      personnel={personnel}
      presentationId={Number(id)}
      fromJoint={params.get("fromJoint") === "1"}
    />
  );
}

/** `/editor/new?teamId=X` - admin'in "Yeni Sunum" ile actigi bos sihirbaz. */
function EditorForNew({ theme, toggleTheme, personnel }) {
  const [params] = useSearchParams();
  const teamId = params.get("teamId");
  return <MainApp theme={theme} toggleTheme={toggleTheme} personnel={personnel} newForTeamId={teamId ? Number(teamId) : null} />;
}

function MainApp({ theme, toggleTheme, personnel, presentationId, newForTeamId, fromJoint }) {
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
  // Sunum önizlemesinde geri sayım için - Kapak adımında PO tarafından
  // girilir, diğer "content" alanlarıyla aynı şekilde kaydedilir/yüklenir.
  const [timerMinutes, setTimerMinutes] = useState(5);
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
  // "Kişi Bazlı Kapasite Özeti" tablosunun kolon basliklari (bkz.
  // DashboardTableHeadersEditor) - Excel/Manuel kaynagindan BAGIMSIZ, tek
  // bir yerde tutulur ve activeDashData icine gomulur ki hem onizleme hem
  // PPTX export (buildFullDeck) hem de kayit/yukleme (handleSave/
  // fetchPresentation hidrasyonu, asagida) AYNI degeri gorsun.
  const [tableHeaders, setTableHeaders] = useState(null);

  // ---- Kayitli sunum yukleme (/editor/:id) + kaydetme hedefi ----
  // Ham state'i birebir yansitan "content" sekli (bkz. plan dokumani) hem
  // hidrasyonda hem kaydetmede kullanilir - simetrik olmasi, kaydet->yukle
  // dongusunun kayipsiz calismasini saglar.
  const [presentationMeta, setPresentationMeta] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: null });
  const saveTeamId = presentationMeta?.teamId ?? newForTeamId ?? personnel?.teamId ?? null;

  // "Jira'dan" sekmesi: DB'de zaten senkronize edilmis (bkz. "Jira'dan Çek")
  // veriyi okur - saveTeamId gerektigi icin bu hook, onun hesaplanmasindan
  // SONRA cagrilir (hook cagri SIRASI her render'da ayni oldugu surece
  // fonksiyon govdesindeki konumu onemli degil).
  const jiraDash = useJiraDashboard(sprintForm.team, sprintForm.setTeam, sprintForm.sprint, sprintForm.setSprint, saveTeamId, sprintForm.teamType);

  const activeDashDataBase =
    dashSource === "manual" ? manual.dashData : dashSource === "jira" ? jiraDash.dashData : (dashboard.dashData || loadedDashData);
  const activeDashData = activeDashDataBase ? { ...activeDashDataBase, tableHeaders } : activeDashDataBase;

  // "Jira'dan Çek" - backend'e senkronizasyon istegini tetikler (RabbitMQ
  // kuyruguna dusurulur, arka planda islenir - bkz. JiraSyncRequestConsumer).
  // Bu yuzden istek BASARILI kabul edildiginde bile veriler o an degil,
  // birkac saniye icinde guncellenir; kullaniciya bunu acikca belirtiyoruz.
  const [jiraSyncing, setJiraSyncing] = useState(false);
  const [jiraSyncNotice, setJiraSyncNotice] = useState(null); // { type: "success" | "error", text }
  const handleJiraSync = () => {
    if (!saveTeamId) {
      setJiraSyncNotice({ type: "error", text: "Jira'dan çekebilmek için önce bir takım seçili olmalı." });
      return;
    }
    const jiraProjectKey = resolveJiraProjectKey(sprintForm.teamType);
    if (!jiraProjectKey) {
      setJiraSyncNotice({
        type: "error",
        text: `"${teamTypeLabel(sprintForm.teamType)}" için Jira proje anahtarı henüz tanımlı değil - bu takım Jira'dan çekilemiyor.`,
      });
      return;
    }
    setJiraSyncing(true);
    setJiraSyncNotice(null);
    triggerJiraSync(saveTeamId, { jiraProjectKey })
      .then(() => {
        setJiraSyncNotice({
          type: "success",
          text: "Jira senkronizasyonu kuyruğa alındı — veriler birkaç saniye içinde güncellenecek.",
        });
      })
      .catch((err) => {
        setJiraSyncNotice({ type: "error", text: err?.message || "Jira senkronizasyonu başlatılamadı." });
      })
      .finally(() => setJiraSyncing(false));
  };

  // Excel'deki Toplam/Tamamlanan sayilari sirket tatilleri ZATEN dusulmus
  // sekilde hazirlaniyor (bkz. kullanici bildirimi) - bu yuzden Excel
  // yuklendiginde, her kisi icin sirket takvimindeki tatil gunleri otomatik
  // izin kaydi olarak eklenir (kullanicinin her satirda "İzin Ekle" acip
  // tek tek secmesine gerek kalmaz). "Manuel Gir" kaynaginda tetiklenmez -
  // orada kullanici zaten kendi girdigi kisiler icin isterse ekler.
  // autoHolidaysKeyRef: ayni kisi listesi icin (orn. render sirasinda persons
  // referansi degisse bile ad listesi ayniysa) TEKRAR calismasini engeller.
  const autoHolidaysKeyRef = useRef(null);
  useEffect(() => {
    if (dashSource !== "excel" || !dashboard.loaded || !saveTeamId || !dashboard.persons.length) return;
    const key = saveTeamId + "|" + dashboard.persons.map((p) => p.name).join("|");
    if (autoHolidaysKeyRef.current === key) return;
    autoHolidaysKeyRef.current = key;
    autoApplyCompanyHolidays(dashboard.persons, saveTeamId).then((totals) => {
      if (!totals.size) return;
      dashboard.persons.forEach((p, i) => {
        const total = totals.get(p.name);
        if (total != null && total !== (p.leaveDays || 0)) dashboard.updatePerson(i, { leaveDays: total });
      });
    });
  }, [dashSource, dashboard.loaded, dashboard.persons, saveTeamId]);

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
        if (c.dashData?.tableHeaders) setTableHeaders(c.dashData.tableHeaders);
        if (c.timerMinutes != null) setTimerMinutes(c.timerMinutes);
        setPresentationMeta({ id: p.id, teamId: p.teamId, sprintNo: p.sprintNo, currentVersion: p.currentVersion });
      })
      .catch((err) => setLoadError(err?.message || "Sunum yüklenemedi."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId]);

  const buildSaveContent = () => ({
    teamType: sprintForm.teamType,
    sprint: sprintForm.sprint,
    range: sprintForm.range,
    sections: sprintForm.sections,
    band: { show: band.show, bars: band.bars },
    dashSource,
    dashData: activeDashData,
    timerMinutes,
  });

  // "Sunum süresi" kaydetmek için zorunlu (bkz. CoverPage bilgi notu) -
  // önizleme geri sayımının anlamlı bir baslangic degeri olmadan
  // kaydedilememesi icin; kullanici sonrasinda istedigi an degistirip
  // tekrar kaydedebilir, tek seferlik bir kilit degil.
  const validateBeforeSave = () => {
    if (!saveTeamId) {
      setWizardAlert("Kaydetmek için bir takım belirlenemedi.");
      return false;
    }
    if (!sprintForm.sprint.trim()) {
      setWizardAlert("Kaydetmek için Sprint No boş bırakılamaz.");
      return false;
    }
    if (!Number(timerMinutes) || Number(timerMinutes) <= 0) {
      setWizardAlert("Kaydetmek için Kapak adımında Sunum Süresi (dakika) girilmelidir.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;
    setSaveStatus({ loading: true, error: null });
    try {
      const saved = await savePresentation({
        teamId: saveTeamId, sprintNo: sprintForm.sprint, dateRange: sprintForm.range, content: buildSaveContent(),
      });
      setPresentationMeta({ id: saved.id, teamId: saved.teamId, sprintNo: saved.sprintNo, currentVersion: saved.currentVersion });
      setSaveStatus({ loading: false, error: null });
    } catch (err) {
      setSaveStatus({ loading: false, error: err?.message || "Kaydedilemedi." });
    }
  };

  // "Güncelle": Ortak Sunum ekranindan (?fromJoint=1) gelindiginde gosterilir
  // - handleSave'in aksine YENI bir surum EKLEMEZ, mevcut guncel surumu
  // YERINDE degistirir (bkz. apiClient.updatePresentationInPlace).
  const handleUpdateInPlace = async () => {
    if (!presentationMeta?.id) return;
    if (!validateBeforeSave()) return;
    setSaveStatus({ loading: true, error: null });
    try {
      const saved = await updatePresentationInPlace(presentationMeta.id, sprintForm.range, buildSaveContent());
      setPresentationMeta({ id: saved.id, teamId: saved.teamId, sprintNo: saved.sprintNo, currentVersion: saved.currentVersion });
      setSaveStatus({ loading: false, error: null });
    } catch (err) {
      setSaveStatus({ loading: false, error: err?.message || "Güncellenemedi." });
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

  const handleGenerateFullDeck = (cornerMesh) =>
    fullExport.run(async () => {
      if (!activeDashData || !activeDashData.kpis) {
        throw new Error(
          dashSource === "manual"
            ? "Kapasite Dashboard adımında önce verileri girip Hesapla'ya basın."
            : dashSource === "jira"
              ? "Kapasite Dashboard adımında önce \"Jira'dan Çek\" ile senkronize edip Yenile'ye basın."
              : "Kapasite Dashboard adımında önce Excel yükleyin."
        );
      }
      const data = { ...sprintForm.data, showBand: band.show, targets: band.bars };
      const pptx = buildFullDeck(data, activeDashData, assets, pptxTheme, cornerMesh);
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
              onUpdate={canEdit && fromJoint && presentationMeta ? handleUpdateInPlace : null}
              updating={saveStatus.loading}
              onJiraSync={handleJiraSync}
              jiraSyncing={jiraSyncing}
            />
          ) : (
            <DashboardTopActions
              onExcelFile={handleExcelFile}
              excelLoading={dashboard.loading}
              onGenerate={() => setExportPreviewOpen(true)}
              generating={fullExport.loading}
              onSave={canEdit ? handleSave : null}
              saving={saveStatus.loading}
              onUpdate={canEdit && fromJoint && presentationMeta ? handleUpdateInPlace : null}
              updating={saveStatus.loading}
              onJiraSync={handleJiraSync}
              jiraSyncing={jiraSyncing}
            />
          )
        }
      />

      {jiraSyncNotice && (
        <div
          role="status"
          style={{
            margin: "10px 22px",
            padding: "10px 14px",
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: jiraSyncNotice.type === "success" ? "#DCFCE7" : "#FEE2E2",
            color: jiraSyncNotice.type === "success" ? "#166534" : "#991B1B",
          }}
        >
          <div style={{ flex: 1 }}>{jiraSyncNotice.text}</div>
          <button
            onClick={() => setJiraSyncNotice(null)}
            aria-label="Bildirimi kapat"
            style={{ border: 0, background: "transparent", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "inherit" }}
          >
            ×
          </button>
        </div>
      )}

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
              timerMinutes={timerMinutes}
              setTimerMinutes={setTimerMinutes}
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
              <DashboardPage
                source={dashSource}
                onSourceChange={setDashSource}
                dashboard={dashboard}
                manual={manual}
                jira={jiraDash}
                teamId={saveTeamId}
                tableHeaders={tableHeaders}
                setTableHeaders={setTableHeaders}
              />
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
        timerSeconds={Number(timerMinutes) > 0 ? Number(timerMinutes) * 60 : null}
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
        onConfirmDownload={async (cornerMesh) => {
          const ok = await handleGenerateFullDeck(cornerMesh);
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
