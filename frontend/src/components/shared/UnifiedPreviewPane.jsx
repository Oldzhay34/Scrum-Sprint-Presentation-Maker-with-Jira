import SlideCanvas from "../sprint/SlideCanvas";
import DashboardSlideCanvas from "../dashboard/DashboardSlideCanvas";
import { useCanvasFit } from "../../hooks/useCanvasFit";

const TABS = [
  { key: "cover", label: "Kapak" },
  { key: "content", label: "İçerik Slaytı" },
  { key: "dashboard", label: "Kapasite Dashboard" },
];

/**
 * Kapak, icerik slayti ve kapasite dashboard'unu TEK bir onizleme panelinde
 * birlestirir - kullanici hangi adimda (sprint parametreleri / dashboard
 * parametreleri) olursa olsun uc goruntuyu de sekmelerle gorebilir.
 */
export default function UnifiedPreviewPane({ sprintData, dashData, assets, activeTab, onTabChange, onZoom }) {
  const { boxRef, scale } = useCanvasFit();

  return (
    <section className="previewwrap">
      <p className="panelttl">Canlı önizleme</p>
      <div className="stage">
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`tab${activeTab === t.key ? " active" : ""}`}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
          <button type="button" className="tab zoomtrig" title="Önizlemeyi büyüt" onClick={onZoom}>
            ⤢ Büyüt
          </button>
        </div>
        <div className="slidebox" ref={boxRef}>
          {activeTab === "dashboard" ? (
            <DashboardSlideCanvas dd={dashData || {}} assets={assets} scale={scale} />
          ) : (
            <SlideCanvas data={sprintData} tab={activeTab} assets={assets} scale={scale} />
          )}
        </div>
        <div className="note">
          Kapak, içerik slaytı ve kapasite dashboard'u arasında sekmelerle geçiş yapabilirsin — hepsi aynı anda güncel tutulur.
        </div>
      </div>
    </section>
  );
}
