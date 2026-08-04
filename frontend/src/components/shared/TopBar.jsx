import { useEffect, useRef, useState } from "react";
import { IconLayers, IconSun, IconMoon } from "./icons";

const DRAG_THRESHOLD = 6; // px - bunun altindaki hareket "tiklama" sayilir
const COLLAPSE_THRESHOLD = 14; // px - yukari/asagi bu kadar cekilince acilir/kapanir

/**
 * Ust bar: Aksa markasina uygun logo/ikon, moda gore degisen eylem butonlari
 * (actions slot), artı acik/koyu tema anahtari. Alt kenardaki tutamactan
 * yukari cekilince (veya tutamaca tiklaninca) daralir/kapanir, asagi
 * cekilince tekrar acilir.
 */
export default function TopBar({ actions, theme, onToggleTheme, excelFileName, personnel }) {
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
        <div className="spacer" />
        {excelFileName && (
          <span className="excel-file-chip" title={excelFileName}>
            <span className="excel-file-chip-icon" aria-hidden="true">📄</span>
            {excelFileName}
          </span>
        )}
        {actions}
        {personnel && (
          <span
            className="personnel-chip"
            title={[personnel.company, personnel.department, personnel.ExtensionAttribute4].filter(Boolean).join(" · ")}
          >
            <span className="personnel-chip-avatar" aria-hidden="true">👤</span>
            <span className="personnel-chip-text">
              <strong>{personnel.title || personnel.ExtensionAttribute4 || "Kullanıcı"}</strong>
              {personnel.department && <span className="personnel-chip-sub">{personnel.department}</span>}
            </span>
          </span>
        )}
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
