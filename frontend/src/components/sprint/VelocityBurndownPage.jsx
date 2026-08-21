import { useRef } from "react";
import Button from "../shared/Button";
import { IconUpload } from "../shared/icons";

/**
 * Bir tek gorsel yukleme kartini cizer - Burndown VE Velocity icin AYNI kart
 * kullanilir (bkz. CoverPage.jsx "Sunum arka planı" kartiyla AYNI gorsel dil:
 * onizleme + Yükle/Değiştir + kosedeki × ile kaldirma).
 */
function ImageUploadCard({ title, hint, image }) {
  const fileInputRef = useRef(null);
  return (
    <>
      <p className="panelttl" style={{ marginTop: 14 }}>{title}</p>
      <div className="sec cover-image-sec">
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {image.url ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Slayttaki kutuyla (.velo-box) BIREBIR AYNI en-boy oraniyla
                  cizilir ki PO buradaki zoom'un slaytta/PPTX'te tam olarak
                  nasil gorunecegini onceden gorsun (bkz. kullanici bildirimi
                  2026-08-20: "kullanıcı preview da nasıl gözükeceğini
                  alanına göre eklediği fotoğrafını büyütüp küçültebilsin"). */}
              <span className="cover-preview-wrap">
                <span className="velo-zoom-previewbox">
                  <img
                    src={image.url}
                    alt={`${title} önizleme`}
                    className="velo-zoom-previewimg"
                    style={{ transform: `scaleX(${image.zoomX}) scaleY(${image.zoomY})` }}
                  />
                </span>
                <button
                  type="button"
                  className="cover-preview-remove"
                  title={`${title} kaldır`}
                  aria-label={`${title} kaldır`}
                  onClick={image.reset}
                >
                  ×
                </button>
              </span>
              {/* Yatay/dikey genişletme AYRI iki bar (bkz. kullanici bildirimi
                  2026-08-20: "yatay ve dikey genişletme için ayrı iki bar
                  koy") - tek uniform zoom yerine her eksen bagimsiz kontrol
                  edilir. */}
              <div className="velo-zoom-control">
                <label htmlFor={`zoomx-${title}`} className="hint" style={{ margin: 0 }}>Yatay genişlet</label>
                <input
                  id={`zoomx-${title}`}
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={image.zoomX}
                  onChange={(e) => image.setZoomX(Number(e.target.value))}
                />
                <span>%{Math.round(image.zoomX * 100)}</span>
              </div>
              <div className="velo-zoom-control">
                <label htmlFor={`zoomy-${title}`} className="hint" style={{ margin: 0 }}>Dikey genişlet</label>
                <input
                  id={`zoomy-${title}`}
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={image.zoomY}
                  onChange={(e) => image.setZoomY(Number(e.target.value))}
                />
                <span>%{Math.round(image.zoomY * 100)}</span>
              </div>
            </div>
          ) : (
            <div className="cover-bg-placeholder" onClick={() => fileInputRef.current?.click()}>
              Görsel yok
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0]) image.setFromFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <span style={{ display: "flex", gap: 10 }}>
              <Button variant="soft" loading={image.uploading} loadingLabel="Yükleniyor…" onClick={() => fileInputRef.current?.click()}>
                <IconUpload className="navbar-icon" />
                {image.url ? "Görseli Değiştir" : "Görsel Yükle"}
              </Button>
            </span>
            {image.uploadError && <div className="hint" style={{ color: "#B45309" }}>{image.uploadError}</div>}
          </div>
        </div>
        <div className="hint" style={{ marginTop: 10 }}>{hint}</div>
      </div>
    </>
  );
}

/**
 * Sihirbazin 4. adimi: Kapasite Dashboard'un ALTINA eklenen "Velocity &
 * Burndown Parametreleri" - PO'nun Jira'dan aldigi iki ekran goruntusu
 * (bkz. kullanici bildirimi 2026-08-20: "velocity chart & burndown graph
 * parametreleri kısmı burada ilk sayfadaki gibi iki tane png yükleme yeri
 * yap"). Ekranda/PPTX'te BURNDOWN USTTE, VELOCITY ALTTA gosterilir - PO'nun
 * paylastigi ornek ekran goruntusundeki sirayla AYNI (kullanici teyidi).
 *
 * Yuklenen gorseller PNG/JPEG gibi HERHANGI bir boyutta olabilir - slaytta/
 * PPTX'te asla ezilmez/tasmaz/ust uste binmez, cunku hem onizleme (CSS
 * object-fit:contain) hem PPTX (pptxgenjs sizing:contain) gorselin GERCEK
 * en-boy oranini kendisi hesaplayip ayrilan kutuya sigdirir - bkz.
 * VelocityBurndownSlideCanvas.jsx / lib/velocityDeckBuilder.js.
 */
export default function VelocityBurndownPage({ velocityBurndown }) {
  return (
    <section>
      <div className="hint" style={{ marginBottom: 4 }}>
        Jira'dan aldığınız Burndown Graph ve Velocity Chart ekran görüntülerini buraya yükleyin — slaytta/PPTX'te
        otomatik olarak orantılı biçimde yerleştirilir, hiçbir zaman taşmaz veya ezilmez.
      </div>
      <ImageUploadCard
        title="Burndown Graph"
        hint="Slaytın üst yarısında gösterilir. Değiştirmezseniz bu bölüm boş kalır."
        image={velocityBurndown.burndown}
      />
      <ImageUploadCard
        title="Velocity Chart"
        hint="Slaytın alt yarısında gösterilir. Değiştirmezseniz bu bölüm boş kalır."
        image={velocityBurndown.velocity}
      />
    </section>
  );
}
