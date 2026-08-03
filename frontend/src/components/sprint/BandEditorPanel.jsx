const COLOR_OPTS = [
  ["green", "Yeşil"], ["blue", "Mavi"], ["orange", "Turuncu"], ["amber", "Sarı"],
  ["red", "Kırmızı"], ["gray", "Gri"], ["purple", "Mor"],
];
const SEGCOL = { green: "8BC34A", blue: "456BBA", orange: "E67514", amber: "E8A64D", red: "D9534F", gray: "9AA3AF", purple: "7C3AED" };

/**
 * Opsiyonel "Hedefler" bandi editoru. Pressman - User Help Facilities:
 * bandpanel altindaki aciklama metni (bandsub) neye yaradigini anlatir.
 */
export default function BandEditorPanel({ band }) {
  return (
    <div className="bandpanel">
      <label className="bandtoggle">
        <input
          type="checkbox"
          checked={band.show}
          onChange={(e) => band.toggleShow(e.target.checked)}
        />
        Hedefler bandı (slaytın üstünde, opsiyonel)
      </label>
      <div className="bandsub">
        Etiketli çubuklar yan yana dizilir; segment genişlikleri değere göre orantılanır. RPA için ayrı bir FTE çubuğu ekleyebilirsiniz.
      </div>
      {band.show && (
        <div id="bandEditor">
          {band.bars.map((bar, bi) => (
            <div className="bar" key={bi}>
              <div className="barrow">
                <input
                  className="barlabel"
                  placeholder="Etiket (örn: RPA HEDEFLERİ, FTE)"
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
                      onChange={(e) => band.updateSegment(bi, si, { value: e.target.value })}
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
          <button type="button" className="addbar" onClick={band.addBar}>
            + Bar ekle
          </button>
        </div>
      )}
    </div>
  );
}
