import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Button from "./Button";
import ZoomModal from "./ZoomModal";
import PptxTemplateModal from "./PptxTemplateModal";
import SlideCanvas from "../sprint/SlideCanvas";
import DashboardSlideCanvas from "../dashboard/DashboardSlideCanvas";
import { IconUsers, IconCheckCircle, IconLayers, IconDownload } from "./icons";
import { fetchTeams, fetchLatestPresentationsByTeams, recordPresentationDownload } from "../../lib/apiClient";
import { sprintDataFromContent } from "../../lib/presentationContent";
import { buildJointDeck } from "../../lib/jointDeckBuilder";
import { SECTION_KEYS, linesOf } from "../../lib/geometry";
import { ASSETS } from "../../assets/pptxAssets";
import { resolveIsAdmin } from "../../lib/teamTypes";
import { DAV_COLORS } from "../../lib/format";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/**
 * Tek bir salt-okunur mini slayt kutusu - .slidebox ile ayni olceklendirme
 * mantigini (useCanvasFit) kullanir. onZoom verilirse tiklaninca/hover'da
 * "büyüt" ipucuyla o takimin sunumunu tam boy modalda acar - coklu takim
 * gorunumunde her birini teker teker, buyultulmus incelemek icin.
 */
function MiniSlideBox({ width = 420, children, onZoom }) {
  const { boxRef, scale } = useCanvasFit();
  return (
    <div
      className={`slidebox joint-mini-slidebox${onZoom ? " zoomable" : ""}`}
      ref={boxRef}
      style={{ width, flex: "0 0 auto" }}
      onClick={onZoom}
      role={onZoom ? "button" : undefined}
      tabIndex={onZoom ? 0 : undefined}
    >
      {children(scale)}
      {onZoom && <span className="joint-mini-slidebox-hint">⤢ Büyüt</span>}
    </div>
  );
}

/** Bir sunumun icerik bolumlerindeki (Tamamlanan/Yapilacak/Riskler/Bekleyen) madde sayilari. */
function sectionCounts(content) {
  const counts = {};
  SECTION_KEYS.forEach((k) => {
    counts[k] = linesOf(content?.sections?.[k] || "").length;
  });
  return counts;
}

const SECTION_LABELS = { done: "Tamamlandı", active: "Devam Ediyor", risk: "Risk", pending: "Bekleyen" };
const SECTION_COLORS = { done: "var(--green)", active: "var(--blue)", risk: "var(--amber)", pending: "var(--purple)" };

/**
 * Tek bir sunumun "Tamamlanan / (Tamamlanan+Yapilacak+Risk+Bekleyen)" oranini
 * gosteren ince halka - coklu takim karsilastirmasi degil, TEK bir sunumun
 * kendi ozet metriği oldugu icin takimin kendi rengini tasir (bkz. --team-accent).
 */
function CompletionRing({ counts, accent, size = 64, stroke = 6 }) {
  const total = SECTION_KEYS.reduce((s, k) => s + counts[k], 0);
  const pct = total > 0 ? Math.round((counts.done / total) * 100) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="joint-ring" role="img" aria-label={`Tamamlanma oranı yüzde ${pct}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--glass-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="joint-ring-label">
        %{pct}
      </text>
    </svg>
  );
}

/**
 * Ortak (coklu takim) sunum ekrani (/ortak-sunum). Takim PO'lari VE admin
 * erisebilir: takimlari sec (veya "Tum takimlari sec"), her takimin EN SON
 * sunumunu tek bir kapak + tekil slaytlar halinde onizle/indir. Yetki modeli
 * backend'deki (PresentationFacade.requireEditAccess) ile BIREBIR AYNI:
 * PO sadece kendi takiminin sunumunu duzenleyebilir, admin hepsini
 * duzenleyebilir, digerleri salt-okunur kalir ("marklanmis sayfalar" = her
 * takim bloğunun kendi duzenlenebilirlik rozeti).
 *
 * "Düzenle" burada ARTIK inline bir bolum editoru DEGIL (bkz. kullanici
 * bildirimi) - o takimin GUNCEL sprintinin tam sihirbaz editorune
 * (/editor/:id) yonlendirir, "?fromJoint=1" ile isaretlenir ki App.jsx orada
 * normal "Kaydet" (yeni surum ekler) yaninda bir de "Güncelle" (mevcut
 * surumu YERINDE degistirir, bkz. apiClient.updatePresentationInPlace)
 * butonu gostersin - kullanici boylece buradan geldigini bilerek daha
 * rahat, TAM sihirbazla guncelleyebilir.
 */
export default function JointPresentationPage({ personnel, theme, onToggleTheme }) {
  const navigate = useNavigate();
  const isAdmin = resolveIsAdmin(personnel);
  const assets = ASSETS;

  const [teams, setTeams] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  const [results, setResults] = useState(null); // [{ teamId, teamName, canEdit, content, sprintData, dashData }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Coklu takim ızgarasinda bir takimin sunumunu tek basina, buyultulmus
  // incelemek icin - { teamId, tab } | null. tab, hangi mini-slide'a
  // tiklandiysa onunla baslar, modal icinde sekmeler arasi gecilebilir.
  const [zoom, setZoom] = useState(null);
  const zoomResult = zoom ? results?.find((r) => r.teamId === zoom.teamId) : null;
  const zoomTabs = zoomResult
    ? [{ key: "content", label: "İçerik Slaytı" }, ...(zoomResult.dashData?.kpis ? [{ key: "dashboard", label: "Kapasite Dashboard" }] : [])]
    : null;

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch((err) => setTeamsError(err?.message || "Takımlar yüklenemedi."))
      .finally(() => setTeamsLoading(false));
  }, []);

  const toggleTeam = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.size === teams.length ? new Set() : new Set(teams.map((t) => t.id))));
  };

  const handleFetch = async () => {
    if (selectedIds.size === 0) {
      setError("En az bir takım seçmelisiniz.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const teamIds = [...selectedIds];
      const presentations = await fetchLatestPresentationsByTeams(teamIds);
      const byTeamId = new Map(presentations.map((p) => [p.teamId, p]));
      const built = teamIds
        .map((teamId) => {
          const p = byTeamId.get(teamId);
          const team = teams.find((t) => t.id === teamId);
          if (!p) return null;
          return {
            teamId,
            teamName: team?.name || p.content?.teamType || "Takım",
            canEdit: isAdmin || (personnel?.teamIds || (personnel?.teamId != null ? [personnel.teamId] : [])).includes(teamId),
            presentationId: p.id,
            content: p.content || {},
            sprintData: sprintDataFromContent(p.content || {}),
            dashData: p.content?.dashData || null,
          };
        })
        .filter(Boolean);
      setResults(built);
      const missing = teamIds.filter((id) => !byTeamId.has(id));
      if (missing.length) {
        const names = missing.map((id) => teams.find((t) => t.id === id)?.name || id).join(", ");
        setError(`Şu takımların kayıtlı sunumu bulunamadı, listeye dahil edilmedi: ${names}`);
      }
    } catch (err) {
      setError(err?.message || "Sunumlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  /** "Düzenle" - o takimin sunumunu tam sihirbaz editorunde acar, "Güncelle" butonunu göstermesi icin isaretlenir (bkz. üstteki modül yorumu). */
  const handleEditTeam = (r) => {
    navigate(`/editor/${r.presentationId}?fromJoint=1`);
  };

  // "PPTX İndir (Ortak)" tiklaninca hemen indirmez - once sablon secim
  // popup'u acilir (bkz. kullanici bildirimi).
  const [pptxTemplateOpen, setPptxTemplateOpen] = useState(false);

  const handleJointExport = async (cornerMesh) => {
    if (!results || results.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const pptx = buildJointDeck(results, assets, theme === "dark" ? "dark" : "light", cornerMesh);
      await pptx.writeFile({ fileName: "Ortak_Sprint_Sunumu.pptx" });
      await recordPresentationDownload("BATCH", results.map((r) => r.teamId)).catch(() => {
        // indirme kaydi best-effort - basarisiz olsa da kullaniciyi engellemez
      });
    } catch (err) {
      setError(err?.message || "Ortak PPTX üretilirken bir hata oluştu.");
    } finally {
      setExporting(false);
    }
  };

  const totalItems = results
    ? results.reduce((sum, r) => sum + SECTION_KEYS.reduce((s, k) => s + sectionCounts(r.content)[k], 0), 0)
    : null;

  return (
    <>
      <TopBar theme={theme} onToggleTheme={onToggleTheme} personnel={personnel} />
      <main className="joint-presentation-page" style={{ padding: "20px 22px" }}>
        <div className="panelttl" style={{ marginBottom: 4 }}>Ortak Sunum</div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Birden fazla takımın en son sunumunu tek bir kapak altında birleştirip önizleyin ve PPTX olarak indirin.
          Sadece kendi takımınızın (adminseniz tüm takımların) sayfalarını buradan düzenleyebilirsiniz.
        </div>

        <div className="joint-kpi-row">
          <div className="joint-kpi-tile joint-kpi-blue">
            <span className="joint-kpi-icon"><IconUsers style={{ width: 18, height: 18 }} /></span>
            <div className="joint-kpi-text">
              <span className="joint-kpi-value">{teams.length}</span>
              <span className="joint-kpi-label">Toplam Takım</span>
            </div>
          </div>
          <div className="joint-kpi-tile joint-kpi-green">
            <span className="joint-kpi-icon"><IconCheckCircle style={{ width: 18, height: 18 }} /></span>
            <div className="joint-kpi-text">
              <span className="joint-kpi-value">{selectedIds.size}</span>
              <span className="joint-kpi-label">Seçili Takım</span>
            </div>
          </div>
          <div className="joint-kpi-tile joint-kpi-purple">
            <span className="joint-kpi-icon"><IconLayers style={{ width: 18, height: 18 }} /></span>
            <div className="joint-kpi-text">
              <span className="joint-kpi-value">{totalItems ?? "—"}</span>
              <span className="joint-kpi-label">Toplam Madde</span>
            </div>
          </div>
          <div className="joint-kpi-tile joint-kpi-amber">
            <span className="joint-kpi-icon"><IconDownload style={{ width: 18, height: 18 }} /></span>
            <div className="joint-kpi-text">
              <span className="joint-kpi-value">{results?.length ?? 0}</span>
              <span className="joint-kpi-label">Hazır Sunum</span>
            </div>
          </div>
        </div>

        <div className="bandpanel joint-filter-panel" style={{ marginBottom: 16 }}>
          <div className="bandtoggle joint-filter-title" style={{ cursor: "default" }}>
            <span className="joint-filter-title-badge">
              <IconUsers style={{ width: 14, height: 14 }} />
            </span>
            Takımlar
          </div>
          {teamsLoading && <div className="mhint">Yükleniyor…</div>}
          {teamsError && <div className="login-error">{teamsError}</div>}
          {!teamsLoading && !teamsError && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontWeight: 600 }}>
                <input type="checkbox" checked={selectedIds.size === teams.length && teams.length > 0} onChange={toggleAll} />
                Tüm takımları seç
              </label>
              <div className="joint-team-select-grid">
                {teams.map((t, i) => {
                  const accent = "#" + DAV_COLORS[i % DAV_COLORS.length];
                  const checked = selectedIds.has(t.id);
                  const r = results?.find((x) => x.teamId === t.id);
                  const itemCount = r ? SECTION_KEYS.reduce((s, k) => s + sectionCounts(r.content)[k], 0) : null;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      className={`joint-team-select-card${checked ? " checked" : ""}`}
                      style={{ "--team-accent": accent }}
                      onClick={() => toggleTeam(t.id)}
                      aria-pressed={checked}
                    >
                      <span className="joint-team-select-check" aria-hidden="true">✓</span>
                      <span className="joint-team-select-av" style={{ background: accent }}>
                        {(t.name || "?").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="joint-team-select-name">{t.name}</span>
                      <span className="joint-team-select-sub">{itemCount != null ? `${itemCount} madde` : "Önizlemede güncellenir"}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="primary" loading={loading} loadingLabel="Getiriliyor…" onClick={handleFetch}>
                  Önizle
                </Button>
                {results && (
                  <Button variant="soft" loading={exporting} loadingLabel="Hazırlanıyor…" onClick={() => setPptxTemplateOpen(true)}>
                    PPTX İndir (Ortak)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

        {results && results.length === 0 && <div className="presentation-list-empty">Seçilen takımların kayıtlı sunumu bulunamadı.</div>}

        <div className="joint-team-grid">
          {results?.map((r) => {
            const idx = teams.findIndex((t) => t.id === r.teamId);
            const accent = "#" + DAV_COLORS[(idx < 0 ? 0 : idx) % DAV_COLORS.length];
            return (
              <div key={r.teamId} className="sec joint-team-card" style={{ "--team-accent": accent }}>
                <div className="head" style={{ justifyContent: "space-between" }}>
                  <span className="joint-team-card-title">
                    <span className="joint-team-card-av" style={{ background: accent }}>
                      {(r.teamName || "?").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="t">{r.teamName}</span>
                  </span>
                  <span className="tools" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {r.canEdit ? (
                      <span className="joint-badge joint-badge-edit">Düzenlenebilir</span>
                    ) : (
                      <span className="joint-badge joint-badge-readonly">🔒 Salt okunur</span>
                    )}
                    {r.canEdit && (
                      <button type="button" className="addbar" onClick={() => handleEditTeam(r)}>
                        Düzenle
                      </button>
                    )}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                  <div className="joint-summary">
                    <CompletionRing counts={sectionCounts(r.content)} accent={accent} />
                    <span className="joint-summary-caption">Tamamlanma Oranı</span>
                    <div className="joint-summary-breakdown">
                      {["done", "active"].map((key) => (
                        <span key={key} className="joint-summary-row">
                          <span className="joint-summary-dot" style={{ background: SECTION_COLORS[key] }} />
                          {sectionCounts(r.content)[key]} {SECTION_LABELS[key]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <MiniSlideBox onZoom={() => setZoom({ teamId: r.teamId, tab: "content" })}>
                    {(scale) => <SlideCanvas data={r.sprintData} tab="content" assets={assets} scale={scale} />}
                  </MiniSlideBox>
                  {r.dashData?.kpis && (
                    <MiniSlideBox onZoom={() => setZoom({ teamId: r.teamId, tab: "dashboard" })}>
                      {(scale) => <DashboardSlideCanvas dd={r.dashData} assets={assets} scale={scale} />}
                    </MiniSlideBox>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <ZoomModal
        open={!!zoom}
        onClose={() => setZoom(null)}
        tabs={zoomTabs}
        activeTab={zoom?.tab}
        onTabChange={(tab) => setZoom((z) => (z ? { ...z, tab } : z))}
        renderCanvas={(scale) =>
          zoom?.tab === "dashboard" ? (
            <DashboardSlideCanvas dd={zoomResult?.dashData || {}} assets={assets} scale={scale} />
          ) : (
            <SlideCanvas data={zoomResult?.sprintData} tab="content" assets={assets} scale={scale} />
          )
        }
      />

      <PptxTemplateModal
        open={pptxTemplateOpen}
        onClose={() => setPptxTemplateOpen(false)}
        onConfirm={(customImage) => {
          setPptxTemplateOpen(false);
          handleJointExport(customImage || undefined);
        }}
        downloading={exporting}
      />
    </>
  );
}
