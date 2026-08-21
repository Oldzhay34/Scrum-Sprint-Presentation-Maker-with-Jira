import PptxGenJS from "pptxgenjs";
import { addContentSlide } from "./sprintDeckBuilder";
import { addDashboardSlide } from "./dashboardDeckBuilder";
import { DEFAULT_CORNER_MESH } from "../assets/cornerMesh";

// Resim1 kose-mesh dekorasyonunun gercek en-boy orani (658x960 kaynak PNG).
const CORNER_MESH_RATIO = 658 / 960;

const TR_MONTHS = ["ocak", "şubat", "mart", "nisan", "mayıs", "haziran", "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık"];

/**
 * "24 Temmuz" veya "24.07.2026" gibi bir tarih metnini, farkli tarihleri
 * KARSILASTIRABILECEK bir sayiya cevirir (yil bilgisi yoksa ayni "sezon"
 * icinde oldugu varsayilir - takim sprintleri ayni donemde ilerler).
 * Parse edilemezse null doner.
 */
function parseTrDateOrder(str) {
  const dotted = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dotted) return parseInt(dotted[3], 10) * 10000 + parseInt(dotted[2], 10) * 100 + parseInt(dotted[1], 10);
  const named = str.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)/);
  if (named) {
    const day = parseInt(named[1], 10);
    const monthIdx = TR_MONTHS.indexOf(named[2].toLocaleLowerCase("tr-TR"));
    if (monthIdx >= 0) return monthIdx * 100 + day;
  }
  return null;
}

/**
 * Secilen takimlarin ORTAK (en son/güncel) sprint bitis tarihini dondurur -
 * bu kurumda sprint'ler takim genelinde ayni takvimde ilerledigi icin
 * genellikle ayni bitis tarihinde biter, farkli olsa da EN SON (guncel)
 * tarih gosterilmesi istenir (bkz. kullanici bildirimi: "en sonki güncel
 * tarihleri de çekmesi lazım her takım için bu ortaktır"). Once gercek
 * tarih olarak parse edip EN BUYUGUNU (en gec) secer; hicbiri parse
 * edilemezse (beklenmeyen bir bicim) en sık geceni gosterir (eski davranis,
 * guvenlik agi).
 */
function commonEndDate(teamsPayload) {
  const ends = teamsPayload
    .map((t) => (t.range || "").split(/[–-]/).pop()?.trim())
    .filter(Boolean);
  if (!ends.length) return "";
  const parsed = ends.map((text) => ({ text, order: parseTrDateOrder(text) })).filter((e) => e.order != null);
  if (parsed.length) {
    parsed.sort((a, b) => b.order - a.order);
    return parsed[0].text;
  }
  const counts = new Map();
  ends.forEach((e) => counts.set(e, (counts.get(e) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Ortak (coklu takim) sunumun kapak slaydini ekler. Tekil takim kapak
 * sablonuyla (bkz. sprintDeckBuilder.addCoverSlide) AYNI sol-panel/sag-gorsel
 * duzenini kullanir - onceki surumde tam genislik bir tablo (Takım/Sprint/
 * Tarih) vardi, takim sayisi arttikca buyuyup sag taraftaki gorseli
 * kapatiyordu (bkz. kullanici bildirimi). Artik sadece baslik + ortak bitis
 * tarihi gosterilir, gorsel sag tarafta hep acikta kalir. Icerik + kapasite
 * slaytlari her takim icin AYNEN mevcut (tekil) export'takiyle birebir ayni
 * fonksiyonlarla (addContentSlide/addDashboardSlide) uretilir.
 */
function addJointCoverSlide(pptx, teamsPayload, assets, cornerMesh = DEFAULT_CORNER_MESH) {
  const TEAL = "164E63", ORANGE = "E67514", INK = "1F2937";
  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };
  if (assets.cover_bg) s.addImage({ data: assets.cover_bg, x: 0, y: 0, w: 13.333, h: 7.5 });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 6.4, h: 7.5, fill: { color: "FFFFFF", transparency: 22 } });
  if (cornerMesh) {
    const cmW = 1.7, cmH = cmW / CORNER_MESH_RATIO;
    s.addImage({ data: cornerMesh, x: -0.15, y: 7.5 - cmH + 0.15, w: cmW, h: cmH, transparency: 55 });
  }
  s.addImage({ data: assets.logo_a, x: 0.55, y: 0.42, w: 1.35, h: 1.35 * (63 / 308) });
  s.addImage({ data: assets.logo_b, x: 2.15, y: 0.36, w: 1.05, h: 1.05 * (83 / 227) });
  s.addText("Ortak Sprint Sunumu", { x: 0.55, y: 5.15, w: 5.6, h: 0.9, fontFace: "Calibri", fontSize: 36, bold: true, color: TEAL, margin: 0 });
  s.addShape(pptx.ShapeType.line, { x: 0.6, y: 6.05, w: 2.6, h: 0, line: { color: ORANGE, width: 2.25 } });
  const endDate = commonEndDate(teamsPayload);
  if (endDate) {
    s.addText(endDate, { x: 0.55, y: 6.12, w: 5.6, h: 0.5, fontFace: "Calibri", fontSize: 18, color: INK, margin: 0 });
  }
  return s;
}

/**
 * Secilen tum takimlarin sunumlarini TEK bir pptx'te birlestirir: bir kapak
 * (tum takim adi/sprint/tarih listesi) + her takim icin kendi icerik ve
 * kapasite slaytlari. teamsPayload: [{ teamId, teamName, sprint, range,
 * sprintData, dashData }].
 */
export function buildJointDeck(teamsPayload, assets, theme = "light", cornerMesh) {
  // Varsayilani BURADA, bir kez cozup her addXSlide cagrisina AYNI degeri
  // ACIKCA gecirir - "her takimda gorunmuyor" turu belirsiz durumlara
  // (bkz. kullanici bildirimi) yer birakmamak icin, 3 ayri fonksiyonun
  // KENDI varsayilan parametrelerine (cornerMesh=DEFAULT_CORNER_MESH)
  // guvenmek yerine.
  const mesh = cornerMesh || DEFAULT_CORNER_MESH;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
  pptx.layout = "W16x9";
  addJointCoverSlide(pptx, teamsPayload, assets, mesh);
  teamsPayload.forEach((t) => {
    addContentSlide(pptx, t.sprintData, assets, theme, mesh);
    // Kapasite verisi olmayan takimlarda da slayt eklenir (bos iskeletle,
    // bkz. addDashboardSlide) - eskiden o takimin kapasite sayfasi ortak
    // sunumdan sessizce dusuyordu.
    addDashboardSlide(pptx, t.dashData, assets, theme, mesh);
  });
  return pptx;
}
