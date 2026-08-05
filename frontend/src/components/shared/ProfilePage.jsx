import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import { IconLayers, IconSun, IconMoon, IconLogout } from "./icons";
import { fetchUserProfile } from "../../lib/apiClient";

const ROLE_LABEL = { ADMIN: "Admin", PO: "Takım PO'su" };

const PROFILE_FIELDS = [
  { key: "sicil", label: "Sicil No" },
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
 * 4/6/8) cekilip dogrudan gosterilir - ekstra bir "goster" adimi yok.
 * Tamamen salt-okunur, hicbir alan duzenlenemez.
 */
export default function ProfilePage({ personnel, theme, onToggleTheme, onLogout }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserProfile()
      .then(setDetails)
      .catch((err) => setError(err?.message || "Profil bilgileri alınamadı."))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="profile-name">{personnel?.fullName || "Kullanıcı"}</h1>
        <span className="profile-role-badge">{ROLE_LABEL[personnel?.role] || personnel?.role}</span>

        {loading && <div className="profile-loading">Profil bilgileri yükleniyor…</div>}
        {error && <div className="login-error">{error}</div>}

        {details && (
          <div className="profile-details">
            {PROFILE_FIELDS.map(({ key, label }) => (
              <div className="profile-detail-row" key={key}>
                <span className="profile-detail-label">{label}</span>
                <span className="profile-detail-value">{details[key] || "—"}</span>
              </div>
            ))}
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
