import { useMemo, useState } from "react";
import { parseDashboardExcel } from "../lib/excelParsers";
import { num, autoRange, nfmt1 } from "../lib/format";
import { hasFteTracking } from "../lib/teamTypes";

const DEFAULT_META = { team: "", dateRange: "01 Haziran – 31 Aralık 2026", reportDate: "", reportObj: null };

/**
 * Kapasite Dashboard modunun tum durumunu (Excel'den okunan veri + kullanicinin
 * duzenledigi kisi/rol/tamamlanan + son 2 hafta delta alanlari) yonetir ve
 * dashSlideHTML'in JSX karsiligi icin gereken `dashData` nesnesini uretir.
 */
export function useDashboardData(dTeam, setDTeam, dSprint, setDSprint, teamType) {
  const [loaded, setLoaded] = useState(false);
  const [persons, setPersons] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [meta, setMeta] = useState(DEFAULT_META);
  // "İş_Listesi" sayfasindaki "FTE" sutunu baska hicbir hesaplamada kullanilmiyor -
  // toplamini burada tutup dashData.customKpis uzerinden ek bir kart olarak gosteriyoruz.
  // SADECE RPA'da (bkz. asagidaki hasFte kontrolu) - diger takim tiplerinin
  // Excel'inde bu sutun zaten olmuyor ama teamType degismeden Excel yeniden
  // yuklenirse eski totalFte deger yanlislikla baska bir takimda kalmasin diye
  // ayrica hasFte ile de kapatiliyor (bkz. kullanici bildirimi, 2026-08-17:
  // "bu sadece RPA takımında olacak diğer takımlarda olmasın").
  const [totalFte, setTotalFte] = useState(null);

  const [dKapanan, setDKapanan] = useState("");
  const [dEklenen, setDEklenen] = useState("");
  const [dFte, setDFte] = useState("");
  const [dNet, setDNet] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const BASE_INFO = "Excel yükleyin — Kapasite Takip dosyasındaki Rapor sayfası okunur. Sprint modundan farklı olarak burada tüm sayılar Excel'den gelir.";

  const loadFile = (file, onParsed) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseDashboardExcel(e.target.result, dTeam);
        setLoaded(true);
        setPersons(parsed.persons);
        setKpis(parsed.kpis);
        setMeta(parsed.meta);
        setTotalFte(parsed.totalFte);
        // Her yeni Excel yuklendiginde ekip adi da o dosyadan gelenle
        // guncellensin - "sadece bossa doldur" mantigi, alan zaten dolu
        // (varsayilan) oldugu icin hicbir zaman tetiklenmiyordu.
        setDTeam(parsed.meta.team);
        onParsed?.({ teamType: parsed.teamType, sprintNo: parsed.sprintNo, range: parsed.range });
      } catch (err) {
        setError('Excel okunamadı: ' + (err?.message || "bilinmeyen hata") + ' — dosyanın "Rapor" sayfasını içerdiğinden emin olun.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Dosya okunamadı. Lütfen tekrar deneyin.");
      setLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const updatePerson = (index, patch) =>
    setPersons((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const dashData = useMemo(() => {
    // Excel bu oturumda HENUZ yuklenmediyse (loaded=false) kesinlikle null
    // donulmeli - aksi halde ASAGIDA "kpis:null" ile birlikte yine de bir
    // NESNE donuluyordu, App.jsx'teki "dashboard.dashData || loadedDashData"
    // dusmesi HER ZAMAN bu (bos) nesneyi truthy sayip secıyordu, kayitli bir
    // sunum Excel yeniden yuklenmeden kaydedilince/guncellenince kapasite
    // dashboard verisini SESSIZCE SILIYORDU (bkz. kullanici bildirimi: "İş
    // Zekası'nın dashboardu kaybolmuş").
    if (!loaded) return null;
    const team = dTeam.trim() || meta.team || "Ekip";
    const mappedPersons = persons.map((p) => {
      const tam = num(p.tamamlanan);
      // İzin günleri (LeaveDaysField/PersonMappingTable ile eklenir) Excel'in
      // kendi "Kapasite" sayfasinda YER ALMAZ (Excel'den SONRA, uygulama
      // icinde eklenir) - bu yuzden "Kullanılabilir Kapasite"den burada
      // dusulmesi gerekir (bkz. kullanici bildirimi: izin eklenince
      // kapasiteden dusmuyordu). Backend'deki CapacityCalculationService
      // (manuel giris akisi) ile AYNI mantik: kapasite negatife duşmez.
      const kapasite = Math.max(0, num(p.kapasite) - num(p.leaveDays || 0));
      // "Bakım Hariç Kalan Kapasite" (varsa) ayni izin dususuyle birlikte
      // tasinir - Kapasite Farkı hesabinin (DashboardEditModal
      // computeKpisFromPersons / asagidaki acikFazla) hala dogru kalmasi
      // icin; goruntulenen "Kapasite" degerini (yukaridaki, "Kalan İş
      // Günü" kaynakli) ETKİLEMEZ.
      const bakimliKapasite = p.bakimliKapasite != null ? Math.max(0, num(p.bakimliKapasite) - num(p.leaveDays || 0)) : null;
      return { name: p.name, role: p.role, initials: p.initials, toplam: p.toplam, tamamlanan: tam, acik: p.toplam - tam, kapasite, bakimliKapasite, doluluk: p.doluluk, durum: p.durum };
    });
    const k0 = kpis || { toplam: 0, doluluk: 0, durum: "" };
    const toplam = k0.toplam;
    const tamamlanan = mappedPersons.reduce((s, p) => s + p.tamamlanan, 0);
    const acik = toplam - tamamlanan;
    const kapasite = mappedPersons.reduce((s, p) => s + p.kapasite, 0);
    // Kapasite Farkı: Excel'in Rapor sayfasinda ARTIK hazir bir alan var
    // (Rapor!B32 = "Bakım Hariç Kalan Kapasite" − "Kalan Efor") - varsa
    // dogrudan o kullanilir ki PO'nun Excel'de gordugu rakamla birebir aynisi
    // gorunsun. Eski sablonlarda alan yoksa, AYNI formul kisi satirlarindaki
    // "Bakım Hariç Kalan Kapasite" (p.kapasite - bkz. excelParsers, Kapasite
    // sayfasindaki K kolonu) uzerinden hesaplanir.
    const acikFazla = k0.kapasiteFarki != null ? k0.kapasiteFarki : kapasite - acik;
    const kpisOut = { toplam, tamamlanan, acik, kapasite, doluluk: k0.doluluk, acikFazla, durum: k0.durum };

    let delta = null;
    if (loaded) {
      delta = {
        kapanan: dKapanan,
        eklenen: dEklenen,
        fte: dFte,
        net: dNet !== "" ? num(dNet) : num(dKapanan) - num(dEklenen),
        range: autoRange(meta.reportObj),
      };
    }
    // "Toplam FTE" sadece RPA'da (hasFteTracking) gosterilir - baska takim
    // tipinde Excel'de bu sutun zaten olmayacagi icin totalFte null gelir,
    // ama teamType degismeden ayni oturumda onceki (RPA) Excel'den kalma bir
    // deger varsa hasFte kontrolu bunu ekstra guvenceye alir.
    const customKpis = hasFteTracking(teamType) && totalFte != null
      ? [{ label: "Toplam FTE", value: nfmt1(totalFte), unit: "İş kalemlerinden (Excel)" }]
      : [];

    return {
      team,
      sprintNo: dSprint,
      dateRange: meta.dateRange,
      reportDate: meta.reportDate,
      kpis: loaded ? kpisOut : null,
      persons: mappedPersons,
      delta,
      deltaRange: delta ? delta.range : "",
      customKpis,
    };
  }, [dTeam, dSprint, dKapanan, dEklenen, dFte, dNet, persons, kpis, meta, loaded, totalFte, teamType]);

  // Ekip adi (dTeam) her degistiginde bu mesaj da guncellensin - Excel'den okunan
  // ismi donup kalmasin, kapak sayfasindaki gibi guncel degeri yansitsin.
  const info = useMemo(() => {
    if (!loaded) return BASE_INFO;
    return (
      `Excel okundu — ${dTeam.trim() || meta.team} · ${persons.length} kişi · Rapor Tarihi ${meta.reportDate}. ` +
      "Aşağıdan ad/rol ve Tamamlanan değerlerini girin (Açık = Toplam − Tamamlanan otomatik)."
    );
  }, [loaded, dTeam, meta, persons.length]);

  // Excel'in "Rapor Tarihi" degeri ISO (YYYY-MM-DD) olarak - izin gunlerinin
  // SADECE bu tarihten sonrasi kapasiteden dusulsun diye LeaveDaysField'a
  // pencere alt siniri olarak gecilir (bkz. lib/leaveDays.js
  // sumFractionsInWindow, kullanici bildirimi 2026-08-20).
  const reportDateIso = meta.reportObj instanceof Date && !isNaN(meta.reportObj)
    ? meta.reportObj.toISOString().slice(0, 10)
    : null;

  return {
    loaded, persons, loading, error, info,
    dTeam, setDTeam, dSprint, setDSprint,
    dKapanan, setDKapanan, dEklenen, setDEklenen, dFte, setDFte, dNet, setDNet,
    loadFile, updatePerson, dashData, reportDateIso,
    hasFte: hasFteTracking(teamType),
  };
}
