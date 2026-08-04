import { useEffect, useRef, useState } from "react";
import { IconLayers, IconPresentation, IconGauge, IconSun, IconMoon } from "./icons";

const DRAG_THRESHOLD = 6; // px - bunun altindaki hareket "tiklama" sayilir
const COLLAPSE_THRESHOLD = 14; // px - yukari/asagi bu kadar cekilince acilir/kapanir

/**
 * Ust bar: Aksa markasina uygun logo/ikon, mod anahtari (Sprint Sunumu /
 * Kapasite Dashboard) ve moda gore degisen eylem butonlari (actions slot),
 * artı acik/koyu tema anahtari. Alt kenardaki tutamactan yukari cekilince
 * (veya tutamaca tiklaninca) daralir/kapanir, asagi cekilince tekrar acilir.
 */
export default function TopBar({ mode, onModeChange, actions, theme, onToggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const dragState = useRef(null); // { startY, moved }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragState.current) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      if (Math.abs(y - dragState.current.startY) > DRAG_THRESHOLD) dragState.current.moved = true;
    };
    const onUp = (e) => {
      if (!dragState.current) return;
      const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) ?? dragState.current.startY;
      const delta = y - dragState.current.startY;
      if (!dragState.current.moved) {
        setCollapsed((c) => !c);
      } else if (delta < -COLLAPSE_THRESHOLD) {
        setCollapsed(true);
      } else if (delta > COLLAPSE_THRESHOLD) {
        setCollapsed(false);
      }
      dragState.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const startDrag = (e) => {
    dragState.current = { startY: e.touches ? e.touches[0].clientY : e.clientY, moved: false };
  };

  return (
    <header className={`topbar${collapsed ? " topbar-collapsed" : ""}`}>
      <div className="topbar-content">
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
      </div>
      <button
        type="button"
        className="topbar-handle"
        onPointerDown={startDrag}
        aria-label={collapsed ? "Üst çubuğu genişlet" : "Üst çubuğu daralt"}
        title={collapsed ? "Genişletmek için tıkla veya aşağı sürükle" : "Daraltmak için tıkla veya yukarı sürükle"}
      >
        <span className="topbar-handle-grip" />
      </button>
    </header>
  );
}
