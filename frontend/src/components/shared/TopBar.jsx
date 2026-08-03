/**
 * Ust bar: baslik, mod anahtari (Sprint Sunumu / Kapasite Dashboard) ve
 * moda gore degisen eylem butonlari (actions slot).
 */
export default function TopBar({ mode, onModeChange, actions }) {
  return (
    <header className="topbar">
      <div>
        <h1>Sprint &amp; Dashboard Üretici</h1>
        <div className="sub">Sprint sunumu ve kapasite dashboard'unu üret · canlı önizle · markalı PPTX indir</div>
      </div>
      <div className="modesw">
        <button
          type="button"
          className={`mbtn${mode === "sprint" ? " active" : ""}`}
          onClick={() => onModeChange("sprint")}
        >
          Sprint Sunumu
        </button>
        <button
          type="button"
          className={`mbtn${mode === "dash" ? " active" : ""}`}
          onClick={() => onModeChange("dash")}
        >
          Kapasite Dashboard
        </button>
      </div>
      <div className="spacer" />
      {actions}
    </header>
  );
}
