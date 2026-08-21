import { useLayoutEffect, useRef, useState } from "react";
import { CARD_TONES, DAV_COLORS, barColor, buildCustomKpiCards, buildSummaryCards, dStatus, nfmt2, npct, personTotals } from "../../lib/format";
import { resolveTableHeaders } from "../../lib/dashboardTableHeaders";
import { DEFAULT_CORNER_MESH } from "../../assets/cornerMesh";
import { emptyDashData } from "../../lib/emptyDashData";

const S = 96; // px per inch - dashboardDeckBuilder.js ile AYNI inc koordinatlari
const CORNER_MESH_RATIO = 658 / 960;

/**
 * Kisi Bazli Kapasite Ozeti tablosundaki kisi ikonu: Jira profil fotografi
 * (assignee.avatarUrls) varsa onu gosterir; yoksa (veya foto yuklenemezse -
 * orn. Jira gizlilik ayari nedeniyle 403) adin bas harflerini renkli bir
 * dairede gosterir. Ayni desen referans "Jira Dashboard" projesindeki
 * Avatar.jsx bileseninde de kullaniliyor.
 */
function PersonAvatar({ avatarUrl, initials, color, size }) {
  const [failed, setFailed] = useState(false);
  const sizeStyle = size ? { width: size, height: size, fontSize: Math.round(size * 0.35) } : undefined;
  if (avatarUrl && !failed) {
    return (
      <div className="av" style={{ ...sizeStyle, overflow: "hidden", padding: 0 }}>
        <img
          src={avatarUrl}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return <div className="av" style={{ ...sizeStyle, background: color }}>{initials}</div>;
}

/**
 * Kapasite dashboard slaydini (KPI kartlari + son 2 hafta delta + kisi tablosu)
 * 1280x720 sabit tuval uzerinde cizer. Orijinal dashSlideHTML ile birebir aynidir.
 */
export default function DashboardSlideCanvas({ dd, assets, scale }) {
  // Henuz hicbir veri kaynagi (Excel/Manuel/Jira) yuklenmemisken/cekilmemisken
  // once ayri, sade bir "Excel yükleyin" mesaji gosteriliyordu ama bu,
  // kullaniciya gercek (dolu) dashboard'un NASIL gorunecegi hakkinda hicbir
  // fikir vermiyordu. Artik AYNI render yolu (asagida) emptyDashData() ile
  // calistirilir - yani "dolu" dashboard'un BOS hali (sifir/"–" degerli KPI
  // kartlari, kisi tablosu basligi ama satir yok) gorunur (bkz. kullanici
  // bildirimi, 2026-08-17: "kapasite dashboard un verilerle dolu halinin boş
  // hali gözüksün"). DashboardEditModal.jsx AYNI emptyDashData()'yi "Düzenle"
  // ekraninin bos hali icin kullanir.
  const data = dd.kpis ? dd : { ...emptyDashData(), tableHeaders: dd.tableHeaders };

  const th = resolveTableHeaders(data.tableHeaders);
  const cards = [...buildSummaryCards(data), ...buildCustomKpiCards(data)];
  const persons = data.persons || [];
  const totals = personTotals(data.persons);
  // "Dönem Kapanan: .." VE "Canlıya Alınan FTE: .." not satirlari TAMAMEN
  // KALDIRILDI - kullanici teyidi 2026-08-20. Kapanan zaten "Dönem Kapanan
  // İş Yükü" KPI kartinda ayrica gosteriliyordu; FTE ise artik ayri bir not
  // yerine DOGRUDAN "Toplam FTE" kartinin (customKpis) kendisine yaziliyor
  // (bkz. DashboardEditModal.updateDelta - "mavi kutunun içi değişecek
  // toplam FTE o çünkü"). Ayni kural PPTX ciktisinda da uygulanir (bkz.
  // dashboardDeckBuilder.js) - ikisi HER ZAMAN birebir ayni gorunur.
  const noteParts = [];

  // Kisi tablosu, kisi sayisi ne olursa olsun sabit 1280x720 tuvalin disina
  // taşmamali - eskiden satir yuksekligi sabit CSS'ten (~48px) geliyordu, 8+
  // kisilik takimlarda tablo tuvalin altina taşip "EKİP TOPLAMI" satiri hic
  // gorunmuyordu (bkz. kullanici bildirimi). Dogru butce (baslik/KPI
  // kartlari/not satiri toplam ne kadar yer kapliyor) CSS'ten elle tekrar
  // hesaplanmak yerine GERCEK DOM'dan olculur (bkz. asagidaki useLayoutEffect)
  // - boylece tasarim/CSS degisse bile taşma bir daha olmaz.
  const dtableRef = useRef(null);
  const rowsWrapRef = useRef(null);
  const totalRef = useRef(null);
  const fitAttemptsRef = useRef(0);
  const [rowScale, setRowScale] = useState(1);
  const dataShapeKey = persons.length + "|" + noteParts.length + "|" + cards.length;

  // Veri degisince (takim/kisi sayisi, not satiri, KPI kart sayisi) once
  // dogal (1x) olcege donulur - asagidaki duzeltme olcumu HEP temiz bir
  // taban uzerinden yeniden baslasin diye.
  useLayoutEffect(() => {
    fitAttemptsRef.current = 0;
    setRowScale(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataShapeKey]);

  // Tablonun gercekte tuvalin (720px native yukseklik) disina taşip taşmadigi
  // GERCEK DOM'dan (offsetTop/scrollHeight - CSS transform'dan etkilenmeyen
  // layout degerleri) olculur; taşiyorsa satirlar sigana kadar kucultulur.
  //
  // ESKIDEN burada bir "taban" (0.78) vardi, ona ulasilinca kisi listesi kendi
  // ic scroll'una geciyordu - kullanici bildirimi 2026-08-20: "isimler aşağı
  // kaydırılmalı yapılmış bu böyle olmayacak ne kadar kişi olursa olsun
  // tabloda kişiler ona göre küçülecek ama ekranın tamamı korunacak ...
  // toplamlar ... kesilmeden tamamı görünecek". Yani scroll KABUL EDILMIYOR:
  // ekran goruntusu/PPTX'te scroll cubugu diye bir sey yok, her seyin TEK
  // BAKISTA gorunmesi gerekiyor. Taban artik cok daha asagida (ekstrem buyuk
  // takimlarda okunabilirlik dusebilir ama "hic gorunmemek"ten iyidir) ve
  // scroll'a gecen yol tamamen kaldirildi - deneme sayisi da fazla kisi icin
  // yeterli yakinsama olsun diye artirildi.
  const ROW_SCALE_FLOOR = 0.32;
  useLayoutEffect(() => {
    if (persons.length === 0) return;
    const rowsEl = rowsWrapRef.current;
    const dtableEl = dtableRef.current;
    const totalEl = totalRef.current;
    if (!rowsEl || !dtableEl) return;
    const CANVAS_H = 7.5 * S; // 720 - .dash inset:0 ile tuvali birebir dolduruyor
    const BOTTOM_MARGIN = 14;
    const totalH = totalEl ? totalEl.offsetHeight : 0;
    const availForRows = CANVAS_H - BOTTOM_MARGIN - rowsEl.offsetTop - totalH;
    const naturalRowsH = rowsEl.scrollHeight; // GERCEK icerik yuksekligi

    if (naturalRowsH <= availForRows) return;
    if (rowScale > ROW_SCALE_FLOOR && fitAttemptsRef.current < 14) {
      fitAttemptsRef.current += 1;
      setRowScale((prev) => Math.max(ROW_SCALE_FLOOR, Math.min(1, prev * (availForRows / naturalRowsH) * 0.97)));
    }
    // Tabanda bile sigmiyorsa (ASIRI kalabalik bir takim) elden gelen en
    // kucuk olcekte birakilir - scroll'a DUSULMEZ, kullanici teyidiyle bu
    // artik istenmeyen bir davranis.
  });

  // PPTX'teki (dashboardDeckBuilder.js) ile AYNI inc koordinatlari - sol kenar
  // boşluğunda (x=0..0.4 HER ZAMAN bos, KPI kartlari da "Kişi" kolonu da
  // x=0.4'te baslar). Eskiden sag-altta "Durum" kolonunun ustune biniyordu
  // (bkz. kullanici bildirimi: "kapasite sayfasında ise çok yanlış bir yerde").
  const cmW = 1.9, cmH = cmW / CORNER_MESH_RATIO;
  // eskiden neredeyse tamami slayt disina taşiyordu (bkz. kullanici
  // bildirimi: "hala sayfa dışında kalıyor") - saga kaydirildi.
  const cmX = -cmW * 0.42, cmY = 7.5 - cmH + 0.15;

  return (
    <div className="slidecanvas tab-dashboard" style={{ transform: `scale(${scale})` }}>
      <div className="dash">
        {/* .dash kendi (opak PANEL rengi) arka planini tasidigi icin sablon
            gorseli BUNUN UZERINDE (ilk cocuk), ama kpi kartlari/tablo gibi
            geri kalan icerigin ALTINDA olmali - bkz. pptx katman sirasi
            (dashboardDeckBuilder.js: panel bg -> daireler -> mesh -> icerik). */}
        {/* "Sunum arka planı" - Icerik slaytiyla AYNI katman (bkz.
            SlideCanvas.jsx): PO'nun yukledigi gorsel TUM slaytlarin zemini
            oldugu icin kapasite dashboard'una da uygulanir. .dash'in kendi
            opak zemininin USTUNDE, geri kalan icerigin ALTINDA. */}
        {assets.slide_bg && (
          <div className="slide-page-bg" style={{ backgroundImage: `url(${assets.slide_bg})` }} />
        )}
        {/* Ozel arka plan varken sablonun kose deseni gizlenir (kullanici
            teyidi 2026-08-20). */}
        {!assets.slide_bg && (
          <img
            className="corner-mesh-deco"
            src={DEFAULT_CORNER_MESH}
            alt=""
            aria-hidden="true"
            style={{ position: "absolute", left: cmX * S, top: cmY * S, width: cmW * S, height: cmH * S, opacity: 0.55, pointerEvents: "none", filter: "blur(1.5px)", transform: "scaleX(-1)" }}
          />
        )}
        {/* .dkpis/.dcard/.dtable normal akista (position verilmemis) -
            konumlandirilmis elemanlar DOM sirasindan bagimsiz olarak HER
            ZAMAN statik akis icerigin USTUNDE boyanir; bu wrapper'a
            position:relative vermek onu mesh img ile AYNI seviyeye getirip
            DOM sirasina (mesh -> wrapper) gore dogru sekilde USTTE
            boyanmasini saglar - aksi halde mesh, kartlarin/tablonun
            USTUNE cikardi. */}
        <div style={{ position: "relative" }}>
        <div className="dlogos">
          <img src={assets.logo_b} alt="" />
          <img src={assets.logo_a} alt="" />
        </div>
        <div className="dttl">{data.team} Kapasite Planı</div>
        <div className="dsub">
          {data.sprintNo ? `Sprint ${data.sprintNo}  •  ` : ""}
          {data.dateRange}
          {"  •  Rapor Tarihi: "}
          {data.reportDate}
        </div>
        <div className="dsec">Ekip Özet</div>
        <div className="dkpis">
          {cards.map((c, i) => {
            const tone = c.toneName ? CARD_TONES[c.toneName] : null;
            return (
              <div
                className="dcard"
                key={i}
                data-tone={c.toneName || undefined}
                style={{ "--tone-bg": tone ? "#" + tone.bg : undefined, "--tone-border": tone ? "#" + tone.border : undefined }}
              >
                <div className="cl">{c.label}</div>
                <div className="cv" style={{ color: tone ? "#" + tone.fg : "var(--ink)", fontSize: c.text ? 18 : 27 }}>{c.value}</div>
                <div className="cu">{c.sub}</div>
              </div>
            );
          })}
        </div>
        {noteParts.length > 0 && (
          <div className="dnote">
            {noteParts.map((t, i) => (
              <span key={i}>{t}</span>
            ))}
          </div>
        )}
        <div className="dhead">Kişi Bazlı Kapasite Özeti</div>
        <div className="dtable" ref={dtableRef}>
          <div className="dtr h">
            <span>{th.kisi}</span>
            <span className="ctr">{th.tamamlanan}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.acik}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.kapasite}<b className="ag">(AG)</b></span>
            <span className="ctr">{th.toplam}<b className="ag">(AG)</b></span>
            <span>{th.doluluk}</span>
            <span className="ctr">{th.durum}</span>
          </div>
          <div ref={rowsWrapRef}>
          {persons.map((p, i) => {
            const ps = dStatus(p.durum, p.doluluk);
            const av = "#" + DAV_COLORS[i % DAV_COLORS.length];
            const fill = Math.max(4, Math.min(100, Number(p.doluluk) * 100)).toFixed(1);
            return (
              <div className="dtr" key={i} style={{ padding: `${7 * rowScale}px 0`, gap: 6 * rowScale }}>
                <div className="kisi" style={{ gap: 10 * rowScale }}>
                  <PersonAvatar
                    avatarUrl={p.avatarUrl}
                    initials={(p.initials || p.name.slice(0, 2)).toUpperCase()}
                    color={av}
                    size={34 * rowScale}
                  />
                  <div>
                    <div className="nm" style={{ fontSize: 14 * rowScale }}>{p.name}</div>
                    {p.role && <div className="rl" style={{ fontSize: 10 * rowScale }}>{p.role}</div>}
                  </div>
                </div>
                <div className="c" style={{ fontSize: 14 * rowScale }}>{nfmt2(p.tamamlanan)}</div>
                <div className="c b" style={{ fontSize: 14 * rowScale }}>{nfmt2(p.acik)}</div>
                <div className="c" style={{ fontSize: 14 * rowScale }}>{nfmt2(p.kapasite)}</div>
                <div className="c" style={{ fontSize: 14 * rowScale }}>{nfmt2(p.toplam)}</div>
                <div className="dol">
                  <div className="dbar"><i style={{ width: fill + "%", background: "#" + barColor(p.doluluk), "--fill-accent": "#" + barColor(p.doluluk) }} /></div>
                  <div className="pc" style={{ fontSize: 12 * rowScale }} title={p.bakimOrani != null ? `Kişiye özel bakım oranı: %${Math.round(p.bakimOrani * 100)}` : "Takım geneli bakım oranı kullanılıyor"}>
                    {npct(p.doluluk)}
                    {p.bakimOrani != null && <span style={{ fontSize: 9 * rowScale, color: "var(--mut)", marginLeft: 4 }}>(bakım %{Math.round(p.bakimOrani * 100)})</span>}
                  </div>
                </div>
                <div className="pill" style={{ color: "#" + ps.fg, background: "#" + ps.bg, borderColor: "#" + ps.fg, "--pill-accent": "#" + ps.fg, fontSize: 11 * rowScale }}>
                  {ps.label}
                </div>
              </div>
            );
          })}
          </div>
          {persons.length > 0 && (
            <div className="dtr total" ref={totalRef} style={{ paddingTop: 12 * rowScale, marginTop: 4 * rowScale }}>
              <div className="tlabel" style={{ fontSize: 12 * rowScale }}>EKİP TOPLAMI</div>
              <div className="c" style={{ fontSize: 14 * rowScale, padding: `${7 * rowScale}px 0` }}>{nfmt2(totals.tamamlanan)}</div>
              <div className="c" style={{ fontSize: 14 * rowScale, padding: `${7 * rowScale}px 0` }}>{nfmt2(totals.acik)}</div>
              <div className="c" style={{ fontSize: 14 * rowScale, padding: `${7 * rowScale}px 0` }}>{nfmt2(totals.kapasite)}</div>
              <div className="c" style={{ fontSize: 14 * rowScale, padding: `${7 * rowScale}px 0` }}>{nfmt2(totals.toplam)}</div>
              <div />
              <div />
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
