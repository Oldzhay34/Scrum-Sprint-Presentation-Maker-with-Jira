import SlideCanvas from "./SlideCanvas";
import { useCanvasFit } from "../../hooks/useCanvasFit";

export default function PreviewPane({ data, assets, curTab, onTabChange, onZoom }) {
  const { boxRef, scale } = useCanvasFit();

  return (
    <section className="previewwrap">
      <p className="panelttl">Canlı önizleme</p>
      <div className="stage">
        <div className="tabs">
          <button
            type="button"
            className={`tab${curTab === "content" ? " active" : ""}`}
            onClick={() => onTabChange("content")}
          >
            İçerik slaytı
          </button>
          <button
            type="button"
            className={`tab${curTab === "cover" ? " active" : ""}`}
            onClick={() => onTabChange("cover")}
          >
            Kapak
          </button>
          <button type="button" className="tab zoomtrig" title="Önizlemeyi büyüt" onClick={onZoom}>
            ⤢ Büyüt
          </button>
        </div>
        <div className="slidebox" ref={boxRef}>
          <SlideCanvas data={data} tab={curTab} assets={assets} scale={scale} />
        </div>
        <div className="note">
          Kutu genişliği sabittir; <b>uzunluk yazdıkça otomatik ayarlanır</b>. Önizleme çıktının birebir düzenidir.
        </div>
      </div>
    </section>
  );
}
