import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconSun, IconMoon, IconPresentation, IconSettings, IconIdCard, IconLogout, IconHistory } from "./icons";
import { ASSETS } from "../../assets/pptxAssets";
import { resolveIsAdmin } from "../../lib/teamTypes";
import { logout } from "../../lib/apiClient";

const DRAG_THRESHOLD = 6; // px - bunun altindaki hareket "tiklama" sayilir
const COLLAPSE_THRESHOLD = 14; // px - yukari/asagi bu kadar cekilince acilir/kapanir

/**
 * Ust bar: Aksa markasina uygun logo/ikon, moda gore degisen eylem butonlari
 * (actions slot), artı acik/koyu tema anahtari. Alt kenardaki tutamactan
 * yukari cekilince (veya tutamaca tiklaninca) daralir/kapanir, asagi
 * cekilince tekrar acilir. Profil rozeti metin tasimaz, tiklaninca dogrudan
 * /profile sayfasina gotururu (orada kullanici bilgileri ve cikis yap yer alir).
 */
export default function TopBar({ actions, theme, onToggleTheme, excelFileName, personnel }) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState(null);
  const dragState = useRef(null); // { startY, moved }
  const settingsRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const settingsCloseTimer = useRef(null);
  const navigate = useNavigate();

  // Panel .topbar-content'in overflow:hidden'ini (daraltma animasyonu icin,
  // bkz. theme.css) asmak icin position:fixed kullanir - konumu butonun
  // ekrandaki gercek konumundan hesaplar (parent'in clip kutusuna bagli kalmaz).
  const computeSettingsPos = () => {
    if (!settingsBtnRef.current) return;
    const r = settingsBtnRef.current.getBoundingClientRect();
    setSettingsPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  };

  // Fareyle uzerine gelince acilir (hover), tiklama sadece dokunmatik/klavye
  // icin yedek kalir. Butondan panele gecerken kisa bir gecikmeyle kapanmasi
  // engellenir (aksi halde aradaki 8px bosluk yuzunden titreyip kapanirdi).
  const openSettings = () => {
    if (settingsCloseTimer.current) {
      clearTimeout(settingsCloseTimer.current);
      settingsCloseTimer.current = null;
    }
    computeSettingsPos();
    setSettingsOpen(true);
  };
  const scheduleCloseSettings = () => {
    settingsCloseTimer.current = setTimeout(() => setSettingsOpen(false), 150);
  };
  const toggleSettings = () => {
    if (!settingsOpen) computeSettingsPos();
    setSettingsOpen((o) => !o);
  };

  // Ayarlar menusu disina tiklaninca kapanir.
  useEffect(() => {
    if (!settingsOpen) return;
    const onDocClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [settingsOpen]);

  useEffect(() => () => {
    if (settingsCloseTimer.current) clearTimeout(settingsCloseTimer.current);
  }, []);

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
          <button
            type="button"
            className="topbar-logo-btn"
            onClick={() => navigate("/")}
            title="Ana sayfa"
            aria-label="Ana sayfaya git"
          >
            <img src={ASSETS.logo_b} alt="Aksa" />
          </button>
          <div>
            <h1>Sprint &amp; Dashboard Üretici</h1>
            <div className="sub">Sprint sunumu ve kapasite dashboard'unu üret · canlı önizle · markalı PPTX indir</div>
          </div>
        </div>
        <div className="spacer" />
        <div className="topbar-actions">
        {excelFileName && (
          <span className="excel-file-chip" title={excelFileName}>
            <span className="excel-file-chip-icon" aria-hidden="true">📄</span>
            {excelFileName}
          </span>
        )}
        {actions}
        {personnel && (
          <div className="settings-menu" ref={settingsRef} onMouseEnter={openSettings} onMouseLeave={scheduleCloseSettings}>
            <button
              type="button"
              className="theme-toggle"
              ref={settingsBtnRef}
              onClick={toggleSettings}
              title="Ayarlar"
              aria-label="Ayarlar"
              aria-haspopup="true"
              aria-expanded={settingsOpen}
            >
              <IconSettings />
            </button>
            {settingsOpen && settingsPos && (
              <div className="settings-menu-panel" style={{ position: "fixed", top: settingsPos.top, right: settingsPos.right }}>
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => {
                    onToggleTheme();
                    setSettingsOpen(false);
                  }}
                >
                  {theme === "dark" ? <IconSun className="navbar-icon" /> : <IconMoon className="navbar-icon" />}
                  Tema
                </button>
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => {
                    navigate("/profile");
                    setSettingsOpen(false);
                  }}
                >
                  <IconIdCard className="navbar-icon" />
                  Profil
                </button>
                {!resolveIsAdmin(personnel) && (
                  <button
                    type="button"
                    className="settings-menu-item"
                    onClick={() => {
                      navigate("/presentations");
                      setSettingsOpen(false);
                    }}
                  >
                    <IconHistory className="navbar-icon" />
                    Sunumlarım
                  </button>
                )}
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => {
                    navigate("/ortak-sunum");
                    setSettingsOpen(false);
                  }}
                >
                  <IconPresentation className="navbar-icon" />
                  Ortak Sunum Hazırla
                </button>
                <div className="settings-menu-divider" />
                <button
                  type="button"
                  className="settings-menu-item settings-menu-item-danger"
                  onClick={() => {
                    setSettingsOpen(false);
                    logout().finally(() => {
                      window.location.href = "/";
                    });
                  }}
                >
                  <IconLogout className="navbar-icon" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        )}
        </div>
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
