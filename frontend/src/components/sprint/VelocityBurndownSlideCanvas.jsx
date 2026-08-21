/**
 * Sihirbazin 4. adiminda yuklenen Burndown/Velocity ekran goruntulerini
 * 1280x720 sabit tuval uzerinde, diger slaytlarla (icerik/kapasite) AYNI
 * ust bilgi/logo/serit/alt bilgi seridini kullanarak cizer - bkz.
 * kullanici bildirimi 2026-08-20: "velocity chart & burndown graph
 * parametreleri kısmı ... ilk sayfadaki gibi iki tane png yükleme yeri".
 *
 * BURNDOWN USTTE, VELOCITY ALTTA (PO'nun paylastigi ornek ekran
 * goruntusundeki sirayla AYNI, kullanici teyidi 2026-08-20).
 *
 * "Orantı motoru": her gorsel kendi kutusuna CSS `object-fit: contain` ile
 * yerlestirilir - tarayici gorselin GERCEK piksel en-boy oranini kendisi
 * hesaplar, PO'nun yukledigi ekran goruntusu ne boyutta olursa olsun asla
 * ezilmez/tasmaz/kesilmez, iki kutu da SABIT (birbirine asla binmeyen) alan
 * kaplar. PPTX ciktisinda AYNI sonuc pptxgenjs'in yerlesik
 * `sizing:{type:"contain"}` ozelligiyle elde edilir (bkz.
 * lib/velocityDeckBuilder.js) - harici bir kutuphaneye gerek yoktur, hem
 * tarayici hem pptxgenjs bu hesabi zaten kendi icinde yapar.
 */
export default function VelocityBurndownSlideCanvas({
  data, burndownUrl, velocityUrl,
  burndownZoomX = 1, burndownZoomY = 1, velocityZoomX = 1, velocityZoomY = 1,
  assets, scale,
}) {
  const footerTeam = (data.teamName || "Ekip").trim();
  return (
    <div className="slidecanvas tab-velocity" style={{ transform: `scale(${scale})` }}>
      {assets.slide_bg && (
        <div className="slide-page-bg" style={{ backgroundImage: `url(${assets.slide_bg})` }} />
      )}
      <div className="s-header">{data.subtitle}</div>
      <div className="s-logos">
        <img src={assets.logo_b} alt="" />
        <img src={assets.logo_a} alt="" />
      </div>
      <div className="s-rule" />

      <div className="velo-box velo-box-top">
        <div className="velo-box-label">Burndown Graph</div>
        {burndownUrl ? (
          <div className="velo-box-imgwrap">
            <img className="velo-box-img" src={burndownUrl} alt="Burndown Graph" style={{ transform: `scaleX(${burndownZoomX}) scaleY(${burndownZoomY})` }} />
          </div>
        ) : (
          <div className="velo-box-empty">Burndown Graph görseli yüklenmedi</div>
        )}
      </div>
      <div className="velo-box velo-box-bottom">
        <div className="velo-box-label">Velocity Chart</div>
        {velocityUrl ? (
          <div className="velo-box-imgwrap">
            <img className="velo-box-img" src={velocityUrl} alt="Velocity Chart" style={{ transform: `scaleX(${velocityZoomX}) scaleY(${velocityZoomY})` }} />
          </div>
        ) : (
          <div className="velo-box-empty">Velocity Chart görseli yüklenmedi</div>
        )}
      </div>

      <div className="s-footer">Gizli &amp; Dahili Kullanım&nbsp;&nbsp;|&nbsp;&nbsp;{footerTeam}</div>
    </div>
  );
}
