import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Button from "./Button";
import { IconActivity, IconChevronLeft, IconChevronRight, IconClock, IconFilter, IconRefresh, IconUsers } from "./icons";
import { fetchAuditFilterOptions, fetchAuditLogs, fetchAuditSummary } from "../../lib/apiClient";

const PAGE_SIZE = 25;

const RANGE_OPTIONS = [
  { value: "", label: "Tüm zamanlar" },
  { value: "today", label: "Bugün" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
];

const SUCCESS_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "true", label: "Başarılı" },
  { value: "false", label: "Başarısız" },
];

function rangeToFrom(range) {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.toISOString();
  }
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return "";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** actionCode'un icerdigi anahtar kelimeye gore rozet rengini (CSS class'i) belirler. */
function actionTone(code, success) {
  if (success === false) return "danger";
  const c = code || "";
  if (c.includes("DELETE")) return "danger";
  if (c.includes("CREATE")) return "success";
  if (c.includes("ROLLBACK")) return "warn";
  if (c.includes("STATUS")) return "accent";
  if (c.includes("LOGIN") || c.includes("LOGOUT")) return "auth";
  return "info";
}

const ENTITY_TYPE_LABELS = {
  AUTH: "Oturum",
  PRESENTATION: "Sunum",
  TEAM: "Takım",
  MEMBER: "Ekip Üyesi",
  WORK_ITEM: "İş Kalemi",
  LEAVE: "İzin",
  ASSET: "Dosya",
};

/**
 * Admin-only genel aktivite/monitoring sayfasi (/admin/monitoring). Backend'deki
 * AuditLogInterceptor'in otomatik yakaladigi TUM mutasyon isteklerini (sunum
 * kaydetme, takim/uye/is kalemi CRUD, login vb.) filtrelenebilir bir liste
 * olarak gosterir - salt okunur, hicbir aksiyon tetiklemez.
 */
export default function MonitoringPage({ personnel, theme, onToggleTheme }) {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [filterOptions, setFilterOptions] = useState({ actors: [], actions: [], teams: {} });
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actorSicil, setActorSicil] = useState("");
  const [actionCode, setActionCode] = useState("");
  const [teamId, setTeamId] = useState("");
  const [success, setSuccess] = useState("");
  const [range, setRange] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchAuditFilterOptions()
      .then(setFilterOptions)
      .catch(() => {});
  }, []);

  const loadSummary = useCallback(() => {
    fetchAuditSummary()
      .then(setSummary)
      .catch(() => {});
  }, []);

  const loadLogs = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAuditLogs({
      actorSicil, actionCode, teamId, success,
      from: rangeToFrom(range),
      page, size: PAGE_SIZE,
    })
      .then(setLogs)
      .catch((err) => setError(err?.message || "Aktivite kayıtları yüklenemedi."))
      .finally(() => setLoading(false));
  }, [actorSicil, actionCode, teamId, success, range, page]);

  useEffect(loadSummary, [loadSummary]);
  useEffect(loadLogs, [loadLogs]);

  const resetFilters = () => {
    setActorSicil("");
    setActionCode("");
    setTeamId("");
    setSuccess("");
    setRange("");
    setPage(0);
  };

  const hasActiveFilters = actorSicil || actionCode || teamId || success || range;

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const refreshAll = () => {
    loadSummary();
    loadLogs();
  };

  const teamOptions = useMemo(
    () => Object.entries(filterOptions.teams || {}).sort((a, b) => a[1].localeCompare(b[1], "tr")),
    [filterOptions.teams]
  );

  return (
    <>
      <TopBar
        theme={theme}
        onToggleTheme={onToggleTheme}
        personnel={personnel}
        actions={
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            ← Takımlara Dön
          </Button>
        }
      />
      <main className="monitoring-page">
       <div className="monitoring-content">
        <div className="monitoring-header">
          <h2 className="monitoring-title">
            <IconActivity style={{ width: 20, height: 20 }} />
            İzleme &amp; Aktivite Logu
          </h2>
          <p className="monitoring-sub">Sistemdeki tüm kayıt/değişiklik işlemlerinin kim, ne zaman, ne yaptığı geçmişi.</p>
        </div>

        <div className="monitoring-kpis">
          <KpiTile tone="blue" icon={<IconActivity />} label="Bugünkü İşlem" value={summary ? summary.actionsToday : "—"} />
          <KpiTile tone="green" icon={<IconUsers />} label="Bugün Aktif Kullanıcı" value={summary ? summary.activeActorsToday : "—"} />
          <KpiTile tone="purple" icon={<IconFilter />} label="Bugün En Sık" value={summary?.topActionLabelToday || "—"} isText />
          <KpiTile
            tone="amber"
            icon={<IconClock />}
            label="Son İşlem"
            value={summary?.lastAction ? formatDateTime(summary.lastAction.createdAt) : "—"}
            sub={summary?.lastAction ? `${summary.lastAction.actorName || summary.lastAction.actorSicil} · ${summary.lastAction.actionLabel}` : null}
            isText
          />
        </div>

        <div className="monitoring-filterbar">
          <div className="monitoring-filterbar-title">
            <IconFilter style={{ width: 15, height: 15 }} />
            Filtrele
          </div>
          <div className="monitoring-filter-fields">
            <select className="premium-select" value={actorSicil} onChange={handleFilterChange(setActorSicil)}>
              <option value="">Tüm kullanıcılar</option>
              {filterOptions.actors.map((a) => (
                <option key={a.sicil} value={a.sicil}>{a.name || a.sicil}</option>
              ))}
            </select>
            <select className="premium-select" value={actionCode} onChange={handleFilterChange(setActionCode)}>
              <option value="">Tüm eylemler</option>
              {filterOptions.actions.map((a) => (
                <option key={a.code} value={a.code}>{a.label}</option>
              ))}
            </select>
            <select className="premium-select" value={teamId} onChange={handleFilterChange(setTeamId)}>
              <option value="">Tüm takımlar</option>
              {teamOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select className="premium-select" value={success} onChange={handleFilterChange(setSuccess)}>
              {SUCCESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select className="premium-select" value={range} onChange={handleFilterChange(setRange)}>
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="monitoring-filterbar-actions">
            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters}>Filtreleri Temizle</Button>
            )}
            <Button variant="soft" onClick={refreshAll} title="Yenile">
              <IconRefresh style={{ width: 15, height: 15 }} />
            </Button>
          </div>
        </div>

        <div className="monitoring-log-panel">
          <div className="monitoring-log-panel-head">
            <span className="monitoring-log-panel-title">Aktivite Kayıtları</span>
            {logs && !loading && !error && (
              <span className="monitoring-log-panel-count">{logs.totalElements} kayıt</span>
            )}
          </div>
          {loading && <div className="presentation-list-empty">Yükleniyor…</div>}
          {error && <div className="login-error" style={{ margin: "0 0 12px" }}>{error}</div>}
          {!loading && !error && logs && logs.content.length === 0 && (
            <div className="presentation-list-empty">
              <IconActivity style={{ width: 28, height: 28, opacity: 0.5 }} />
              Bu filtrelerle eşleşen bir aktivite kaydı yok.
            </div>
          )}

          {!loading && !error && logs && logs.content.length > 0 && (
            <div className="monitoring-log-scroll">
              <div className="monitoring-log-list">
                <div className="monitoring-log-row monitoring-log-row-head" aria-hidden="true">
                  <span>Zaman</span>
                  <span>Kullanıcı</span>
                  <span>Eylem</span>
                  <span>Hedef</span>
                  <span>Takım</span>
                </div>
                {logs.content.map((entry) => (
                  <div className="monitoring-log-row" key={entry.id}>
                    <span className="monitoring-log-cell" data-label="Zaman">
                      <span className="monitoring-log-time">{formatDateTime(entry.createdAt)}</span>
                    </span>
                    <span className="monitoring-log-cell" data-label="Kullanıcı">
                      <span className="monitoring-log-actor">{entry.actorName || entry.actorSicil || "—"}</span>
                      {entry.actorSicil && <span className="monitoring-log-sicil">#{entry.actorSicil}</span>}
                    </span>
                    <span className="monitoring-log-cell" data-label="Eylem">
                      <span className={`monitoring-badge tone-${actionTone(entry.actionCode, entry.success)}`}>
                        {entry.actionLabel}
                      </span>
                    </span>
                    <span className="monitoring-log-cell" data-label="Hedef">
                      {entry.entityType ? (ENTITY_TYPE_LABELS[entry.entityType] || entry.entityType) : "—"}
                      {entry.entityId ? ` · #${entry.entityId}` : ""}
                    </span>
                    <span className="monitoring-log-cell" data-label="Takım">
                      {entry.teamName || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {logs && logs.totalPages > 1 && (
            <div className="monitoring-pagination">
              <Button variant="soft" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <IconChevronLeft style={{ width: 15, height: 15 }} />
              </Button>
              <span className="monitoring-pagination-label">
                Sayfa {logs.page + 1} / {logs.totalPages} · {logs.totalElements} kayıt
              </span>
              <Button variant="soft" disabled={page >= logs.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <IconChevronRight style={{ width: 15, height: 15 }} />
              </Button>
            </div>
          )}
        </div>
       </div>
      </main>
    </>
  );
}

function KpiTile({ icon, label, value, sub, isText, tone = "blue" }) {
  return (
    <div className={`monitoring-kpi-tile tone-${tone}`}>
      <div className="monitoring-kpi-icon">{icon}</div>
      <div className="monitoring-kpi-text">
        <span className="monitoring-kpi-label">{label}</span>
        <span className={`monitoring-kpi-value${isText ? " is-text" : ""}`} title={typeof value === "string" ? value : undefined}>
          {value}
        </span>
        {sub && <span className="monitoring-kpi-subtext" title={sub}>{sub}</span>}
      </div>
    </div>
  );
}
