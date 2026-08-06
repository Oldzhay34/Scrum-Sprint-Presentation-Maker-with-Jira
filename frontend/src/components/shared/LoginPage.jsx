import { useEffect, useRef, useState } from "react";
import Button from "./Button";
import { IconSun, IconMoon } from "./icons";
import { login } from "../../lib/apiClient";
import { ASSETS } from "../../assets/pptxAssets";

// Dashboard/icerik slaydinda kullandigimiz 4 bolumun ikon+renk kimligiyle
// birebir ayni (bkz. lib/geometry.js sectionDefs) - login sayfasinda arka
// planda zipliyan (DVD ekran koruyucusu gibi) dekoratif rozetler olarak
// tekrar kullanilir.
const FLOAT_ICONS = [
  { icon: "icon_check", accent: "16a34a", size: 80 },
  { icon: "icon_rocket", accent: "2563eb", size: 96 },
  { icon: "icon_warn", accent: "e0761f", size: 86 },
  { icon: "icon_clock", accent: "7c3aed", size: 74 },
];

/**
 * Ikonlari gercek fizik ile (konum + hiz) hareket ettirip ekran kenarina
 * gelince yansitir - "kenarlara carpsin" istegi. requestAnimationFrame ile
 * dogrudan DOM transform'una yazar (React state'i her frame guncellemez,
 * performans icin). Hareket hassasiyeti tercihinde tamamen devre disi kalir.
 */
function useBouncingIcons(items) {
  const elRefs = useRef([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const els = elRefs.current.filter(Boolean);
    if (!els.length) return undefined;

    const bodies = els.map((el, i) => {
      const size = items[i].size;
      const maxX = Math.max(0, window.innerWidth - size);
      const maxY = Math.max(0, window.innerHeight - size);
      const speed = 0.5 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      return {
        el, size,
        x: Math.random() * maxX,
        y: Math.random() * maxY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    });

    let raf;
    const tick = () => {
      for (const b of bodies) {
        b.x += b.vx;
        b.y += b.vy;
        const maxX = window.innerWidth - b.size;
        const maxY = window.innerHeight - b.size;
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx); }
        else if (b.x >= maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy); }
        else if (b.y >= maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  return elRefs;
}

/**
 * Giris ekrani - sicil/sifre girilip backend'in /api/auth/login endpoint'ine
 * gonderilir (bkz. apiClient.login). Basarili girişte backend {sicil,
 * fullName, role, teamId} doner ve auth cookie'lerini (httpOnly) Set-Cookie
 * ile yazar; bu govde oldugu gibi onLogin(personnel) ile yukari tasinir.
 */
export default function LoginPage({ onLogin, theme, onToggleTheme }) {
  const [sicil, setSicil] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const iconRefs = useBouncingIcons(FLOAT_ICONS);

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
      <div className="login-glow-orb login-glow-orb-a" aria-hidden="true" />
      <div className="login-glow-orb login-glow-orb-b" aria-hidden="true" />
      <div className="login-glow-orb login-glow-orb-c" aria-hidden="true" />
      <div className="login-glow-orb login-glow-orb-d" aria-hidden="true" />
      {FLOAT_ICONS.map((f, i) => (
        <div
          key={f.icon}
          ref={(el) => (iconRefs.current[i] = el)}
          className="login-float-wrap"
          style={{ width: f.size, height: f.size }}
        >
          <img
            className="login-float-icon"
            src={ASSETS[f.icon]}
            alt=""
            aria-hidden="true"
            style={{
              background: `radial-gradient(circle at 30% 28%, #ffffffb0, transparent 42%), linear-gradient(135deg, #${f.accent}, #${f.accent}90)`,
              border: "2px solid rgba(255,255,255,0.55)",
              boxShadow: `0 0 30px #${f.accent}b0, 0 0 12px #${f.accent}`,
            }}
          />
        </div>
      ))}
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
          <img src={ASSETS.logo_b} alt="Aksa" />
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
