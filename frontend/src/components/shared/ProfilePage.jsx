import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { IconLayers, IconSun, IconMoon, IconLogout } from "./icons";
import { fetchUserProfile, updateUserProfile, fetchTeams } from "../../lib/apiClient";

const ROLE_LABEL = { ADMIN: "Admin", PO: "Takım PO'su" };

// sicil salt-okunur (kimlik alani); geri kalan alanlar kullanici tarafindan
// sonradan doldurulabilsin diye duzenlenebilir.
const READONLY_FIELDS = [{ key: "sicil", label: "Sicil No" }];

const EDITABLE_FIELDS = [
  { key: "company", label: "Şirket" },
  { key: "department", label: "Departman" },
  { key: "title", label: "Görev" },
  { key: "extensionAttribute4", label: "Unvan" },
  { key: "extensionAttribute6", label: "Görev (Detay)" },
  { key: "extensionAttribute8", label: "Bağlı Olduğu İdari Kod" },
];

/**
 * Profil sayfasi - ust bardaki avatar rozetine tiklaninca acilir (ayri bir
 * route: /profile). Acilir acilmaz /api/auth/profile'dan AD/personel
 * DTO'suyla birebir ayni alanlar (company/department/title/ExtensionAttribute
 * 4/6/8) cekilip gosterilir. sicil disindaki alanlar + ad soyad + takim
 * "Düzenle" ile acilip PUT /api/auth/profile ile kaydedilebilir - AD/personel
 * servisi baglanana kadar bu bilgiler henuz bos olan hesaplarda (orn. yeni
 * acilan bir hesap) kullanici tarafindan sonradan girilebilsin diye.
 */
export default function ProfilePage({ personnel, theme, onToggleTheme, onLogout, onProfileUpdated }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [teams, setTeams] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    fetchUserProfile()
      .then(setDetails)
      .catch((err) => setError(err?.message || "Profil bilgileri alınamadı."))
      .finally(() => setLoading(false));
    fetchTeams().then(setTeams).catch(() => setTeams([]));
  }, []);

  function startEditing() {
    setForm({
      fullName: details?.fullName || "",
      teamId: details?.teamId ?? "",
      company: details?.company || "",
      department: details?.department || "",
      title: details?.title || "",
      extensionAttribute4: details?.extensionAttribute4 || "",
      extensionAttribute6: details?.extensionAttribute6 || "",
      extensionAttribute8: details?.extensionAttribute8 || "",
    });
    setSaveError("");
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const payload = { ...form, teamId: form.teamId === "" ? null : Number(form.teamId) };
      const updated = await updateUserProfile(payload);
      setDetails(updated);
      setEditing(false);
      onProfileUpdated?.(updated);
    } catch (err) {
      setSaveError(err?.message || "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (personnel?.fullName || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="profile-page">
      <div className="profile-page-bg" aria-hidden="true">
        <span className="profile-blob profile-blob-blue" />
        <span className="profile-blob profile-blob-green" />
        <span className="profile-blob profile-blob-light" />
      </div>

      <button
        type="button"
        className="theme-toggle login-theme-toggle"
        onClick={onToggleTheme}
        title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
        aria-label="Tema değiştir"
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
      </button>

      <button type="button" className="profile-back" onClick={() => navigate("/")}>
        ← Panele Dön
      </button>

      <div className="profile-card">
        <div className="profile-avatar">{initials || "👤"}</div>
        <h1 className="profile-name">{details?.fullName || personnel?.fullName || "Kullanıcı"}</h1>
        <span className="profile-role-badge">{ROLE_LABEL[personnel?.role] || personnel?.role}</span>

        {loading && <div className="profile-loading">Profil bilgileri yükleniyor…</div>}
        {error && <div className="login-error">{error}</div>}

        {details && !editing && (
          <>
            <div className="profile-details">
              {READONLY_FIELDS.map(({ key, label }) => (
                <div className="profile-detail-row" key={key}>
                  <span className="profile-detail-label">{label}</span>
                  <span className="profile-detail-value">{details[key] || "—"}</span>
                </div>
              ))}
              <div className="profile-detail-row">
                <span className="profile-detail-label">Takım</span>
                <span className="profile-detail-value">
                  {teams.find((t) => t.id === details.teamId)?.name || "—"}
                </span>
              </div>
              {EDITABLE_FIELDS.map(({ key, label }) => (
                <div className="profile-detail-row" key={key}>
                  <span className="profile-detail-label">{label}</span>
                  <span className="profile-detail-value">{details[key] || "—"}</span>
                </div>
              ))}
            </div>
            <Button variant="soft" className="profile-action-btn" onClick={startEditing}>
              Profili Düzenle
            </Button>
          </>
        )}

        {editing && form && (
          <div className="profile-details profile-details-edit">
            <label className="profile-field">
              <span className="profile-detail-label">Ad Soyad</span>
              <input
                className="profile-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="profile-field">
              <span className="profile-detail-label">Takım</span>
              <select
                className="profile-input"
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
              >
                <option value="">— Seçilmedi —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            {EDITABLE_FIELDS.map(({ key, label }) => (
              <label className="profile-field" key={key}>
                <span className="profile-detail-label">{label}</span>
                <input
                  className="profile-input"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}

            {saveError && <div className="login-error">{saveError}</div>}

            <div className="profile-edit-actions">
              <Button variant="soft" onClick={() => setEditing(false)} disabled={saving}>
                Vazgeç
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>
        )}

        <Button variant="soft" className="profile-action-btn profile-logout-btn" onClick={onLogout}>
          <IconLogout style={{ width: 16, height: 16 }} />
          Çıkış Yap
        </Button>
      </div>

      <div className="profile-brand">
        <IconLayers style={{ width: 16, height: 16 }} />
        Sprint &amp; Dashboard Üretici
      </div>
    </div>
  );
}
