import { IconLayers, IconPresentation, IconGauge, IconSun, IconMoon } from "./icons";

/**
 * Ust bar: Aksa markasina uygun logo/ikon, mod anahtari (Sprint Sunumu /
 * Kapasite Dashboard) ve moda gore degisen eylem butonlari (actions slot),
 * artı acik/koyu tema anahtari.
 */
export default function TopBar({ mode, onModeChange, actions, theme, onToggleTheme }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10, flex: "none",
            background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <IconLayers style={{ width: 22, height: 22, color: "#fff" }} />
        </div>
        <div>
          <h1>Sprint &amp; Dashboard Üretici</h1>
          <div className="sub">Sprint sunumu ve kapasite dashboard'unu üret · canlı önizle · markalı PPTX indir</div>
        </div>
      </div>
      <div className="modesw">
        <button
          type="button"
          className={`mbtn${mode === "cover" || mode === "sprint" ? " active" : ""}`}
          onClick={() => onModeChange("cover")}
        >
          <IconPresentation className="navbar-icon" />
          Sprint Sunumu
        </button>
        <button
          type="button"
          className={`mbtn${mode === "dash" ? " active" : ""}`}
          onClick={() => onModeChange("dash")}
        >
          <IconGauge className="navbar-icon" />
          Kapasite Dashboard
        </button>
      </div>
      <div className="spacer" />
      {actions}
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
        aria-label="Tema değiştir"
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
      </button>
    </header>
  );
}
