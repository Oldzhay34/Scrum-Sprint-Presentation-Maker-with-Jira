import { IconGauge } from "../shared/icons";
import { sanitizeDecimalInput } from "../../lib/format";
import AlertModal from "../shared/AlertModal";
import BandSelectionModal from "./BandSelectionModal";
import { MAX_BAND_BARS } from "../../hooks/useBandEditor";

const COLOR_OPTS = [
  ["green", "Yeşil"], ["lightgreen", "Açık Yeşil"], ["blue", "Mavi"], ["orange", "Turuncu"], ["amber", "Sarı"],
  ["red", "Kırmızı"], ["gray", "Gri"], ["purple", "Mor"],
];
const SEGCOL = { green: "8BC34A", lightgreen: "A8E6A1", blue: "456BBA", orange: "E67514", amber: "E8A64D", red: "D9534F", gray: "9AA3AF", purple: "7C3AED" };

/**
 * Opsiyonel "Hedefler" bandi editoru. Pressman - User Help Facilities:
 * bandpanel altindaki aciklama metni (bandsub) neye yaradigini anlatir.
 * Gorsel dil kullanicinin referans gorseline gore "hero" kart olarak
 * yenilendi (koyu, parlayan, ikon rozetli) - islevsellik (bar/segment
 * ekle-sil-duzenle) aynen korunur.
 */
export default function BandEditorPanel({ band, hasFte = true }) {
  return (
    <div className="bandpanel bandpanel-hero">
      <div className="bandhero-glow" aria-hidden="true" />
      <div className="bandhead">
        <span className="bandhead-icon">
          <IconGauge style={{ width: 20, height: 20 }} />
        </span>
        <div className="bandhead-text">
          <label className="bandtoggle">
            <input
              type="checkbox"
              checked={band.show}
              onChange={(e) => band.toggleShow(e.target.checked)}
            />
            Hedefler bandı (slaytın üstünde, opsiyonel)
          </label>
          <div className="bandsub">
            Etiketli çubuklar yan yana dizilir; segment genişlikleri değere göre orantılanır.
            {hasFte && " RPA için ayrı bir FTE çubuğu ekleyebilirsiniz."}
          </div>
        </div>
      </div>
      {band.show && (
        <div id="bandEditor">
          {band.bars.map((bar, bi) => (
            <div className="bar" key={bi}>
              <div className="barrow">
                <input
                  className="barlabel"
                  placeholder={hasFte ? "Etiket (örn: RPA HEDEFLERİ, FTE)" : "Etiket (örn: HEDEFLER)"}
                  value={bar.label}
                  onChange={(e) => band.updateBarLabel(bi, e.target.value)}
                />
                <button type="button" className="delbar" onClick={() => band.removeBar(bi)}>
                  Bar sil
                </button>
              </div>
              <div className="segrow">
                {bar.segments.map((seg, si) => (
                  <span className="seg" key={si}>
                    <span className="dot" style={{ background: "#" + (SEGCOL[seg.color] || "456BBA") }} />
                    <input
                      value={seg.value}
                      placeholder="0"
                      inputMode="decimal"
                      onChange={(e) => band.updateSegment(bi, si, { value: sanitizeDecimalInput(e.target.value) })}
                    />
                    <select
                      value={seg.color}
                      onChange={(e) => band.updateSegment(bi, si, { color: e.target.value })}
                    >
                      {COLOR_OPTS.map(([v, t]) => (
                        <option key={v} value={v}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="delseg"
                      title="Segmenti sil"
                      onClick={() => band.removeSegment(bi, si)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button type="button" className="addseg" onClick={() => band.addSegment(bi)}>
                  + segment
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="addbar"
            onClick={band.addBar}
            disabled={band.bars.length >= MAX_BAND_BARS}
            title={band.bars.length >= MAX_BAND_BARS ? `En fazla ${MAX_BAND_BARS} hedef barı ekleyebilirsiniz` : undefined}
          >
            + Bar ekle
          </button>
        </div>
      )}
      <AlertModal open={!!band.error} title="Hedef barı eklenemedi" message={band.error} onClose={band.clearError} />
      <BandSelectionModal candidates={band.pendingChoices} onConfirm={band.confirmChoices} onCancel={band.cancelChoices} />
    </div>
  );
}
