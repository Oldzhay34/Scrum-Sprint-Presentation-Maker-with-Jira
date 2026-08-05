import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import Modal from "./Modal";
import { IconPresentation, IconHistory, IconEdit } from "./icons";
import { fetchPresentations, fetchPresentationVersions, rollbackPresentation } from "../../lib/apiClient";

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

  const reload = () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    fetchPresentations(teamId)
      .then(setPresentations)
      .catch((err) => setError(err?.message || "Sunumlar yüklenemedi."))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [teamId]);

  return (
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
          <div className="presentation-row" key={p.id}>
            <div className="presentation-row-main">
              <span className="presentation-row-sprint">Sprint {p.sprintNo}</span>
              <span className="presentation-row-meta">{p.dateRange || "—"}</span>
              <span className="presentation-row-meta">
                v{p.currentVersion} · {formatDateTime(p.updatedAt)}{p.updatedBy ? ` · ${p.updatedBy}` : ""}
              </span>
            </div>
            <div className="presentation-row-actions">
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
