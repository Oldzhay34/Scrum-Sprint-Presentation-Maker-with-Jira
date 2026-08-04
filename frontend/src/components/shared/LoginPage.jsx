import { useState } from "react";
import Button from "./Button";
import { IconLayers, IconSun, IconMoon } from "./icons";
import { login } from "../../lib/apiClient";

/**
 * Giris ekrani - sicil/sifre girilip backend'in /api/auth/login endpoint'ine
 * gonderilir (bkz. apiClient.login). API imzasini baska bir gelistirici
 * tasarliyor; yanitta company/department/title/ExtensionAttribute4/6/8
 * alanlari beklenir ve oldugu gibi onLogin(personnel) ile yukari tasinir.
 * Endpoint henuz hazir degilse istek hata verir, kullaniciya gosterilir.
 */
export default function LoginPage({ onLogin, theme, onToggleTheme }) {
  const [sicil, setSicil] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sicil.trim() || !password.trim()) {
      setError("Sicil no ve şifre alanları zorunludur.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const personnel = await login(sicil.trim(), password);
      onLogin(personnel);
    } catch (err) {
      setError(err?.message || "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button
        type="button"
        className="theme-toggle login-theme-toggle"
        onClick={onToggleTheme}
        title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
        aria-label="Tema değiştir"
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
      </button>
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <IconLayers style={{ width: 28, height: 28, color: "#fff" }} />
        </div>
        <h1 className="login-title">Sprint &amp; Dashboard Üretici</h1>
        <p className="login-sub">Devam etmek için giriş yapın</p>

        <div className="field">
          <label>Sicil No</label>
          <input
            value={sicil}
            onChange={(e) => setSicil(e.target.value)}
            placeholder="örn: 40539"
            autoFocus
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label>Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <Button type="submit" variant="primary" className="login-submit" loading={loading} loadingLabel="Giriş yapılıyor…">
          Giriş Yap
        </Button>
      </form>
    </div>
  );
}
