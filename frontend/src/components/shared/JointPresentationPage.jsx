import { useEffect, useState } from "react";
import TopBar from "./TopBar";
import Button from "./Button";
import SectionEditor from "../sprint/SectionEditor";
import SlideCanvas from "../sprint/SlideCanvas";
import DashboardSlideCanvas from "../dashboard/DashboardSlideCanvas";
import { fetchTeams, fetchLatestPresentationsByTeams, savePresentation, recordPresentationDownload } from "../../lib/apiClient";
import { sprintDataFromContent } from "../../lib/presentationContent";
import { buildJointDeck } from "../../lib/jointDeckBuilder";
import { sectionDefs, SECTION_KEYS } from "../../lib/geometry";
import { ASSETS } from "../../assets/pptxAssets";
import { resolveIsAdmin } from "../../lib/teamTypes";
import { useCanvasFit } from "../../hooks/useCanvasFit";

/** Tek bir salt-okunur mini slayt kutusu - .slidebox ile ayni olceklendirme mantigini (useCanvasFit) kullanir. */
function MiniSlideBox({ width = 420, children }) {
  const { boxRef, scale } = useCanvasFit();
  return (
    <div className="slidebox" ref={boxRef} style={{ width, flex: "0 0 auto" }}>
      {children(scale)}
    </div>
  );
}

/**
 * Ortak (coklu takim) sunum ekrani (/ortak-sunum). Takim PO'lari VE admin
 * erisebilir: takimlari sec (veya "Tum takimlari sec"), her takimin EN SON
 * sunumunu tek bir kapak + tekil slaytlar halinde onizle/indir. Yetki modeli
 * backend'deki (PresentationFacade.requireEditAccess) ile BIREBIR AYNI:
 * PO sadece kendi takiminin sayfalarini (icerik bolumlerini) duzenleyebilir,
 * admin hepsini duzenleyebilir, digerleri salt-okunur kalir ("marklanmis
 * sayfalar" = her takim bloğunun kendi duzenlenebilirlik rozeti).
 *
 * Kapsam notu: bu ekranda duzenlenebilen tek alan icerik bolumleridir
 * (Tamamlanan/Yapilacak/Riskler/Bekleyen) - hedefler bandi ve kapasite
 * dashboard'u burada salt-okunur kalir, degisiklik gerekiyorsa mevcut tekil
 * /editor/:id sayfasindan yapilir.
 */
export default function JointPresentationPage({ personnel, theme, onToggleTheme }) {
  const isAdmin = resolveIsAdmin(personnel);
  const assets = ASSETS;
  const SEC = sectionDefs(assets);

  const [teams, setTeams] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  const [results, setResults] = useState(null); // [{ teamId, teamName, canEdit, content, sprintData, dashData }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editedSections, setEditedSections] = useState({}); // { [teamId]: { done, active, risk, pending } }
  const [saveStatus, setSaveStatus] = useState({}); // { [teamId]: { loading, error } }

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
            canEdit: isAdmin || personnel?.teamId === teamId,
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

  const startEdit = (r) => {
    setEditedSections((prev) => ({ ...prev, [r.teamId]: { ...(r.content.sections || {}) } }));
    setEditingTeamId(r.teamId);
  };

  const handleSectionChange = (teamId, key, text) => {
    setEditedSections((prev) => ({ ...prev, [teamId]: { ...prev[teamId], [key]: text } }));
  };

  /** SectionEditor'un "+ Ekle" (manuel madde) ve chip akisi onTextChange DEGIL onChipUse cagirir - bkz. SectionEditor.jsx addManualLine. */
  const handleSectionAppend = (teamId, key, line) => {
    setEditedSections((prev) => {
      const current = prev[teamId]?.[key] || "";
      const next = (current.trim() ? current.trim() + "\n" : "") + line;
      return { ...prev, [teamId]: { ...prev[teamId], [key]: next } };
    });
  };

  const handleSaveTeam = async (r) => {
    setSaveStatus((prev) => ({ ...prev, [r.teamId]: { loading: true, error: null } }));
    try {
      const newSections = editedSections[r.teamId];
      const newContent = { ...r.content, sections: newSections };
      const saved = await savePresentation({
        teamId: r.teamId, sprintNo: r.content.sprint, dateRange: r.content.range, content: newContent,
      });
      setResults((prev) =>
        prev.map((x) =>
          x.teamId === r.teamId
            ? { ...x, presentationId: saved.id, content: newContent, sprintData: sprintDataFromContent(newContent) }
            : x
        )
      );
      setSaveStatus((prev) => ({ ...prev, [r.teamId]: { loading: false, error: null } }));
      setEditingTeamId(null);
    } catch (err) {
      setSaveStatus((prev) => ({ ...prev, [r.teamId]: { loading: false, error: err?.message || "Kaydedilemedi." } }));
    }
  };

  const handleJointExport = async () => {
    if (!results || results.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const pptx = buildJointDeck(results, assets, theme === "dark" ? "dark" : "light");
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

  return (
    <>
      <TopBar theme={theme} onToggleTheme={onToggleTheme} personnel={personnel} />
      <main className="joint-presentation-page" style={{ padding: "20px 22px" }}>
        <div className="panelttl" style={{ marginBottom: 4 }}>Ortak Sunum</div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Birden fazla takımın en son sunumunu tek bir kapak altında birleştirip önizleyin ve PPTX olarak indirin.
          Sadece kendi takımınızın (adminseniz tüm takımların) sayfalarını buradan düzenleyebilirsiniz.
        </div>

        <div className="bandpanel" style={{ marginBottom: 16 }}>
          <div className="bandtoggle" style={{ cursor: "default" }}>Takımlar</div>
          {teamsLoading && <div className="mhint">Yükleniyor…</div>}
          {teamsError && <div className="login-error">{teamsError}</div>}
          {!teamsLoading && !teamsError && (
            <>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontWeight: 600 }}>
                <input type="checkbox" checked={selectedIds.size === teams.length && teams.length > 0} onChange={toggleAll} />
                Tüm takımları seç
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {teams.map((t) => (
                  <label key={t.id} className="chip" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleTeam(t.id)}
                      style={{ marginRight: 6 }}
                    />
                    {t.name}
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button variant="primary" loading={loading} loadingLabel="Getiriliyor…" onClick={handleFetch}>
                  Önizle
                </Button>
                {results && (
                  <Button variant="soft" loading={exporting} loadingLabel="Hazırlanıyor…" onClick={handleJointExport}>
                    PPTX İndir (Ortak)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

        {results && results.length === 0 && <div className="presentation-list-empty">Seçilen takımların kayıtlı sunumu bulunamadı.</div>}

        {results?.map((r) => {
          const status = saveStatus[r.teamId];
          const isEditing = editingTeamId === r.teamId;
          return (
            <div key={r.teamId} className="sec" style={{ marginBottom: 18 }}>
              <div className="head" style={{ justifyContent: "space-between" }}>
                <span className="t">{r.teamName}</span>
                <span className="tools" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {r.canEdit ? (
                    <span style={{ color: "var(--teal2)", fontSize: 12, fontWeight: 700 }}>Düzenlenebilir</span>
                  ) : (
                    <span style={{ color: "var(--mut)", fontSize: 12, fontWeight: 700 }}>🔒 Salt okunur</span>
                  )}
                  {r.canEdit && !isEditing && (
                    <button type="button" className="addbar" onClick={() => startEdit(r)}>
                      Düzenle
                    </button>
                  )}
                  {r.canEdit && isEditing && (
                    <>
                      <Button variant="primary" loading={status?.loading} loadingLabel="Kaydediliyor…" onClick={() => handleSaveTeam(r)}>
                        Kaydet
                      </Button>
                      <button type="button" className="delbar" onClick={() => setEditingTeamId(null)}>
                        Vazgeç
                      </button>
                    </>
                  )}
                </span>
              </div>
              {status?.error && <div className="login-error" style={{ margin: "8px 0" }}>{status.error}</div>}

              {isEditing ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                  {SECTION_KEYS.map((key) => (
                    <SectionEditor
                      key={key}
                      sectionKey={key}
                      def={SEC[key]}
                      text={editedSections[r.teamId]?.[key] || ""}
                      onTextChange={(text) => handleSectionChange(r.teamId, key, text)}
                      count={(editedSections[r.teamId]?.[key] || "").split("\n").filter((l) => l.trim()).length}
                      chips={[]}
                      onChipUse={(line) => handleSectionAppend(r.teamId, key, line)}
                      onExpand={() => {}}
                      teamType={r.content.teamType}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                  <MiniSlideBox>{(scale) => <SlideCanvas data={r.sprintData} tab="content" assets={assets} scale={scale} />}</MiniSlideBox>
                  {r.dashData?.kpis && (
                    <MiniSlideBox>{(scale) => <DashboardSlideCanvas dd={r.dashData} assets={assets} scale={scale} />}</MiniSlideBox>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </>
  );
}
