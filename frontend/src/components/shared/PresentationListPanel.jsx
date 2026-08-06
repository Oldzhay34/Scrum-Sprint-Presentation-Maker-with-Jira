import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Modal from "./Modal";
import ZoomModal from "./ZoomModal";
import UnifiedPreviewPane from "./UnifiedPreviewPane";
import SlideCanvas from "../sprint/SlideCanvas";
import DashboardSlideCanvas from "../dashboard/DashboardSlideCanvas";
import { IconPresentation, IconHistory, IconEdit, IconCalendar } from "./icons";
import { fetchPresentations, fetchPresentation, fetchPresentationVersions, rollbackPresentation } from "../../lib/apiClient";
import { sprintDataFromContent } from "../../lib/presentationContent";
import { ASSETS } from "../../assets/pptxAssets";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * Bir takima ait kayitli sprint sunumlarinin listesi. Hem AdminHomePage'in
 * sag panelinde (canManage=true, her takim icin) hem PresentationsPage'te
 * (PO'nun kendi takimi icin) kullanilir. "Duzenle" ayni sihirbaz ekranini
 * (/editor/:id) acar - admin/PO ayrimi App.jsx'teki canEdit mantigiyla zaten
 * cozuluyor, burada sadece navigasyon var.
 */
export default function PresentationListPanel({ teamId, teamName, canManage, showNewButton }) {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyFor, setHistoryFor] = useState(null); // { id, sprintNo }

  // Satira tiklaninca sag/altta acilan "canli onizleme" - sihirbazdaki
  // UnifiedPreviewPane'in AYNISI (Kapak/İçerik/Dashboard karuseli + Preview
  // butonu), sadece bu sayfanin kendi listesine gomulu. Liste endpoint'i
  // (fetchPresentations) sadece ozet dondugu icin secilen satirin TAM
  // icerigi ayrica fetchPresentation(id) ile cekilir.
  const [selectedId, setSelectedId] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState("cover");
  const [zoomOpen, setZoomOpen] = useState(false);

  const reload = () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    fetchPresentations(teamId)
      .then(setPresentations)
      .catch((err) => setError(err?.message || "Sunumlar yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [teamId]);

  // Liste yuklenince (veya takim degisince) ilk sunum otomatik secilir -
  // kullanici hemen bir onizleme gorsun, ayrica tiklamak zorunda kalmasin.
  useEffect(() => {
    if (presentations.length > 0 && !presentations.some((p) => p.id === selectedId)) {
      setSelectedId(presentations[0].id);
    } else if (presentations.length === 0) {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentations]);

  useEffect(() => {
    if (!selectedId) {
      setPreviewContent(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewContent(null);
    setPreviewTab("cover");
    fetchPresentation(selectedId)
      .then((p) => setPreviewContent(p.content || {}))
      .catch(() => setPreviewContent(null))
      .finally(() => setPreviewLoading(false));
  }, [selectedId]);

  const previewSprintData = previewContent ? sprintDataFromContent(previewContent) : null;
  const previewDashData = previewContent?.dashData || null;

  return (
    <div className="presentation-panel-layout">
      <div className="presentation-list-panel">
        <div className="presentation-list-header">
          <h2>{teamName ? `${teamName} — Sprint Sunumları` : "Sprint Sunumları"}</h2>
          {showNewButton && teamId && (
            <Button variant="primary" onClick={() => navigate(`/editor/new?teamId=${teamId}`)}>
              + Yeni Sunum
            </Button>
          )}
        </div>

        {loading && <div className="presentation-list-empty">Yükleniyor…</div>}
        {error && <div className="login-error" style={{ margin: "0 0 12px" }}>{error}</div>}
        {!loading && !error && presentations.length === 0 && (
          <div className="presentation-list-empty">
            <IconPresentation style={{ width: 28, height: 28, opacity: 0.5 }} />
            Bu takım için henüz kayıtlı bir sunum yok.
          </div>
        )}

        <div className="presentation-list">
          {presentations.map((p) => (
            <div
              className={`presentation-row${p.id === selectedId ? " selected" : ""}`}
              key={p.id}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="presentation-row-thumb" style={{ backgroundImage: `url(${ASSETS.cover_bg})` }}>
                <span className="presentation-row-thumb-badge">
                  <IconPresentation style={{ width: 13, height: 13 }} />
                </span>
                <span className="presentation-row-thumb-label">Sprint {p.sprintNo}</span>
              </div>
              <div className="presentation-row-main">
                <span className="presentation-row-sprint">
                  Sprint {p.sprintNo}
                  <span className="presentation-row-version-pill">v{p.currentVersion}</span>
                </span>
                <span className="presentation-row-meta">
                  <IconCalendar style={{ width: 13, height: 13 }} />
                  {p.dateRange || "—"}
                </span>
                <span className="presentation-row-meta presentation-row-meta-sub">
                  {formatDateTime(p.updatedAt)}{p.updatedBy ? ` · ${p.updatedBy}` : ""}
                </span>
              </div>
              <div className="presentation-row-actions" onClick={(e) => e.stopPropagation()}>
                <Button variant="soft" onClick={() => setHistoryFor({ id: p.id, sprintNo: p.sprintNo })}>
                  <IconHistory style={{ width: 15, height: 15 }} />
                  Sürüm Geçmişi
                </Button>
                <Button variant="primary" onClick={() => navigate(`/editor/${p.id}`)}>
                  <IconEdit style={{ width: 15, height: 15 }} />
                  Düzenle
                </Button>
              </div>
            </div>
          ))}
        </div>

        <VersionHistoryModal
          open={!!historyFor}
          presentation={historyFor}
          canRollback={canManage}
          onClose={() => setHistoryFor(null)}
          onRolledBack={() => {
            setHistoryFor(null);
            reload();
          }}
        />
      </div>

      {/* Secili satirin canli onizlemesi - sihirbazdaki UnifiedPreviewPane'in
          AYNISI, bu listeye gomulu halde. Liste bos/yuklenirken gosterilmez. */}
      {presentations.length > 0 && (
        <div className="presentation-preview-col">
          {previewLoading || !previewSprintData ? (
            <div className="presentation-list-empty">Önizleme yükleniyor…</div>
          ) : (
            <UnifiedPreviewPane
              sprintData={previewSprintData}
              dashData={previewDashData}
              assets={ASSETS}
              activeTab={previewTab}
              onTabChange={setPreviewTab}
              onZoom={() => setZoomOpen(true)}
            />
          )}
        </div>
      )}

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
            <DashboardSlideCanvas dd={previewDashData || {}} assets={ASSETS} scale={scale} />
          ) : (
            <SlideCanvas data={previewSprintData} tab={previewTab} assets={ASSETS} scale={scale} />
          )
        }
      />
    </div>
  );
}

function VersionHistoryModal({ open, presentation, canRollback, onClose, onRolledBack }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rollingBackVersion, setRollingBackVersion] = useState(null);

  useEffect(() => {
    if (!open || !presentation) return;
    setLoading(true);
    setError(null);
    fetchPresentationVersions(presentation.id)
      .then(setVersions)
      .catch((err) => setError(err?.message || "Sürüm geçmişi alınamadı."))
      .finally(() => setLoading(false));
  }, [open, presentation]);

  const handleRollback = async (version) => {
    if (!window.confirm(`Sürüm ${version}'e dönülsün mü? Bu, mevcut içeriğin üzerine yeni bir sürüm olarak yazılır.`)) return;
    setRollingBackVersion(version);
    try {
      await rollbackPresentation(presentation.id, version);
      onRolledBack();
    } catch (err) {
      setError(err?.message || "Geri dönülemedi.");
    } finally {
      setRollingBackVersion(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} boxClassName="box version-history-box">
      <h3 style={{ marginTop: 0 }}>Sprint {presentation?.sprintNo} — Sürüm Geçmişi</h3>
      {loading && <div className="presentation-list-empty">Yükleniyor…</div>}
      {error && <div className="login-error" style={{ margin: "0 0 12px" }}>{error}</div>}
      <div className="version-history-list">
        {versions.map((v) => (
          <div className="version-history-row" key={v.version}>
            <span>v{v.version}</span>
            <span className="presentation-row-meta">{formatDateTime(v.updatedAt)}{v.updatedBy ? ` · ${v.updatedBy}` : ""}</span>
            {canRollback && (
              <Button
                variant="soft"
                loading={rollingBackVersion === v.version}
                loadingLabel="Dönülüyor…"
                onClick={() => handleRollback(v.version)}
              >
                Bu sürüme dön
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="ghost" onClick={onClose} style={{ marginTop: 14 }}>
        Kapat
      </Button>
    </Modal>
  );
}
