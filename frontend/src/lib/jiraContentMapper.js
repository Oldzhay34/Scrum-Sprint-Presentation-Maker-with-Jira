import { formatWorkItemName } from "./excelParsers";
import { PRIORITY_COLORS, PRIORITY_ORDER } from "./geometry";
import { makeSuggestion } from "./suggestions";

/**
 * Jira'nin oncelik degerleri Ingilizce/karisik (instance genelinde farkli
 * projeler farkli semalar kullaniyor - GET /rest/api/3/priority ile
 * dogrulandi: Highest/High/Medium/Low/Low1/Acil/Çok Düşük/Yok/Engelleyici),
 * ama slayt/PPTX'teki madde isaretinin rengi (PRIORITY_COLORS, bkz.
 * geometry.js) SADECE 4 Turkce anahtari (Kritik/Yüksek/Orta/Düşük) taniyor.
 * "Yok" (oncelik belirtilmemis) BILEREK null - PRIORITY_UNSET_COLOR/
 * "Belirtilmedi" zaten SlideCanvas'ta bunu ele aliyor, yanlis bir seviye
 * uydurmaktansa bos birakmak daha dogru.
 */
const JIRA_PRIORITY_TO_TR = {
  Highest: "Kritik",
  Acil: "Kritik",
  Engelleyici: "Kritik",
  High: "Yüksek",
  Medium: "Orta",
  Low: "Düşük",
  Low1: "Düşük",
  "Çok Düşük": "Düşük",
  Yok: null,
};

/** Jira'nin oncelik metnini uygulamanin Turkce PRIORITY_COLORS anahtarina cevirir; bilinmeyen/bos deger icin null doner. */
export function translateJiraPriority(rawPriority) {
  if (!rawPriority) return null;
  if (Object.prototype.hasOwnProperty.call(JIRA_PRIORITY_TO_TR, rawPriority)) {
    return JIRA_PRIORITY_TO_TR[rawPriority];
  }
  return PRIORITY_COLORS[rawPriority] ? rawPriority : null;
}

/** "Tamamlanmis" kabul edilen status_code'lar (backend JiraStatusMapper her takim icin ayni 5 degere normalize eder). */
const DONE_STATUS_CODES = new Set(["Canlı", "UAT"]);

/**
 * "Tamamlanan İşler" kutusuna SADECE bu statudeki is kalemleri kaynaklik eder -
 * kullanici teyidi 2026-08-20: "tamamlanmış olanlar sadece canlı dakiler".
 * DONE_STATUS_CODES'tan (Canlı + UAT) BILEREK daha dardir: UAT'taki bir is
 * canliya alinmis sayilmaz, sunumda "tamamlandi" diye gosterilmemeli.
 */
const LIVE_STATUS_CODE = "Canlı";

/**
 * İçerik Slaytı'nin ust oge (Epic) listesine SADECE Gorev/Story seviyesindeki
 * kayitlar girer - PO notu 2026-08-19: "Görev/story alanlarındaki üst öğe
 * bilgisi alınacak". Alt gorevlerin "parent"i Epic DEGIL kendi hikayesidir;
 * alinsalardi liste yine story adlariyla sisecekti. Epic'in KENDISI de
 * dislanir (onun parent'i yok/baska bir Epic'tir).
 *
 * issue_type degeri Jira dilinden geldigi icin (TR/EN kurulumlar farkli)
 * her iki dildeki karsiliklar birlikte taninir; alani bos olan (eski
 * senkronizasyondan kalma) kayitlar DISLANMAZ - aksi halde henuz yeniden
 * senkronize edilmemis bir takimda liste bomboş kalirdi.
 */
const EXCLUDED_ISSUE_TYPES = new Set([
  "alt görev", "alt gorev", "alt-görev", "sub-task", "subtask", "sub task",
  "epic", "epik", "epi̇c",
]);

function isTaskOrStoryLevel(item) {
  const type = (item.issueType || "").trim().toLocaleLowerCase("tr");
  if (!type) return true; // bilinmiyorsa dislama - bkz. yukaridaki not
  return !EXCLUDED_ISSUE_TYPES.has(type);
}

/** Iki oncelikten slaytta daha "yukarida" olani (Kritik > Yüksek > Orta > Düşük > yok) doner. */
function strongerPriority(a, b) {
  const rank = (p) => {
    const i = PRIORITY_ORDER.indexOf(p);
    return i === -1 ? PRIORITY_ORDER.length : i;
  };
  return rank(a) <= rank(b) ? a : b;
}

/** Iki tarihten daha ESKI olani doner (bir Epic'in "eklenme tarihi" = altindaki en eski isin tarihi). */
function earlierDate(a, b) {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) <= new Date(b) ? a : b;
}

/**
 * Bir takimin work_items listesini İçerik Slaytı'nin kutularina gore gruplar.
 *
 * PO notu (2026-08-19) ile TEMELDEN degisti:
 *  1. "Veriler Epicten çekilecek ... Alan kimliği = Parent" - artik tek tek
 *     Gorev/Story'ler degil, onlarin UST OGESI (parentKey/parentTitle)
 *     listelenir. Boylece "bu kadar çok veri" gelmez.
 *  2. "Aynı kayıt birden fazla olabilir sadece 1 tane gelmeli. Çoklanmamalı" -
 *     ayni Epic altindaki tum isler TEK bir maddeye indirgenir; bir Epic ayni
 *     anda iki kutuda da gorunmez (altinda hala acik is varsa Yapılacak,
 *     hepsi bittiyse Tamamlanan).
 *  3. "Tamamlanan İşler = bir önceki sprintin verilerini içerir" /
 *     "Yapılacak İşler = Mevcut sprintin verilerini içerir" - iki kutu FARKLI
 *     sprintlerden beslenir. "Bir onceki sprint" = takimin Jira verisindeki en
 *     son KAPANAN sprint (backend'de previousSprint olarak isaretlenir).
 *     Tamamlanan'a sadece o sprintin CANLI is kalemleri girer, Yapılacak'a
 *     aktif sprintte hala acik isi olan Epic'ler (kullanici teyidi 2026-08-20).
 *  4. "Bekleyen konular ve Riskleri Manuel PO'lar yazacak. Jiradan alma." -
 *     risk/pending kutulari Jira'dan HIC doldurulmaz (bos doner); Jira'nin
 *     "Flagged" alanina dayali eski Riskler eslemesi kaldirildi.
 *
 * Doner: { suggestions: {done, active, risk, pending}, stats }
 */
/**
 * Bir is kalemi listesini parentKey'e gore TEKILLESTIRILMIS Epic kayitlarina
 * cevirir. Ust ogesi olmayan kayitlar sayilir ama listeye girmez (Icerik
 * Slayti Epic seviyesinde calisir).
 */
function groupByParent(items) {
  const byParent = new Map();
  let withoutParent = 0;

  items.forEach((item) => {
    const key = (item.parentKey || "").trim();
    const title = (item.parentTitle || "").trim();
    if (!key || !title) {
      withoutParent++;
      return;
    }
    const priority = translateJiraPriority(item.priority);
    const done = DONE_STATUS_CODES.has(item.statusCode);
    const existing = byParent.get(key);
    if (!existing) {
      byParent.set(key, {
        key,
        title,
        sector: item.sector || null,
        priority,
        addedDate: item.addedDate || null,
        childCount: 1,
        openCount: done ? 0 : 1,
      });
      return;
    }
    existing.sector = existing.sector || item.sector || null;
    existing.priority = strongerPriority(existing.priority, priority);
    existing.addedDate = earlierDate(existing.addedDate, item.addedDate);
    existing.childCount += 1;
    if (!done) existing.openCount += 1;
  });

  return { byParent, withoutParent };
}

function toSuggestion(epic) {
  return makeSuggestion(formatWorkItemName(epic.title, epic.sector, null, epic.priority), {
    priority: epic.priority,
    sector: epic.sector,
    addedDate: epic.addedDate,
    childCount: epic.childCount,
    source: "jira",
  });
}

/**
 * Tek bir HAM is kalemini (Epic'e tekillestirilmeden) oneriye cevirir.
 *
 * Kullanici teyidi 2026-08-20: "tamamlanan işlerde 21 canlı iş 10 u üst öge
 * diyor ... artık bu 21 canlı işin hepsini getirecek" - Epic bazinda gruplama
 * (bkz. toSuggestion/groupByParent, PO notu 2026-08-19) bir onceki sprintte
 * tamamlanmis is sayisini gizliyordu: hem coklu isi TEK Epic satirina
 * indiriyordu hem de bir Epic'in mevcut sprintte HALA acik isi varsa o
 * Epic'in gecmis sprintte biten butun isleri de sessizce dusuyordu (orn.
 * Yapay Zeka ekibinde "PRJ205" epic'i altinda onceki sprintte biten 7 is,
 * epic'in mevcut sprintte devam eden isleri oldugu icin HIC gorunmuyordu).
 * Artik "Tamamlanan İşler" dogrudan HAM is kalemi listesidir.
 */
function toItemSuggestion(item) {
  const priority = translateJiraPriority(item.priority);
  return makeSuggestion(formatWorkItemName(item.title, item.sector, null, priority), {
    priority,
    sector: item.sector,
    addedDate: item.addedDate || null,
    source: "jira",
  });
}

/**
 * previousSprintItems (bir onceki sprintin CANLI is kalemleri) icinden
 * GERCEK tekrarlari eler - ayni Jira kaydi iki kez gelmisse (orn. senkron
 * hatasi) jiraIssueKey ile, o da yoksa baslik+ust oge ile tekillestirilir.
 * Epic bazinda TEKILLESTIRME YAPILMAZ - kullanici teyidi 2026-08-20: "hala
 * tekrar edenler ... gelmeyecek" (sadece GERCEK tekrarlar elenecek, Epic
 * gruplamasi degil).
 *
 * NOT: "label ında takımın adı yazan epicteki işler gelmeyecek" kurali BURADA
 * HENUZ UYGULANMIYOR - Jira senkronizasyonu su an Epic'in Labels alanini
 * work_items'a hic tasimiyor (bkz. WorkItem.java), bu yuzden hangi Epic'in
 * hangi etiketi tasidigi frontend'e gelmiyor. Bu kural icin backend'e yeni
 * bir alan (Epic label senkronizasyonu) eklenmesi gerekiyor.
 */
function dedupeItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.jiraIssueKey
      ? "key:" + item.jiraIssueKey
      : "title:" + (item.parentKey || "") + "|" + (item.title || "").trim().toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/**
 * Bir is kaleminin bagli oldugu Epic'in Labels alaninda (item.parentLabels,
 * backend'de virgulle birlestirilmis - bkz. WorkItem.parentLabels) takimin
 * KENDI Jira proje anahtari (orn. "RPA") geciyor mu? Kullanici teyidi
 * 2026-08-20: "label ında takımın adı yazan epicteki işler gelmeyecek" -
 * orn. RPA-2206 "RPA Ekibi Agile Toplantılar" epic'i "RPA" label'i tasir,
 * bu idari/toplanti isidir, gercek teslim edilen is degildir.
 * jiraProjectKey verilmemisse (cagiran taraf bilmiyorsa) hicbir sey elenmez.
 */
function epicLabeledWithOwnTeam(item, jiraProjectKey) {
  if (!jiraProjectKey || !item.parentLabels) return false;
  const needle = jiraProjectKey.trim().toLocaleLowerCase("tr");
  if (!needle) return false;
  return item.parentLabels
    .split(",")
    .some((label) => label.trim().toLocaleLowerCase("tr") === needle);
}

export function bucketWorkItemsForContent(workItems, jiraProjectKey) {
  const taskLevel = (workItems || []).filter(isTaskOrStoryLevel);
  // Tamamlanan = BIR ONCEKI sprint (backend'de en son kapanan sprint olarak
  // isaretlenir - bkz. JiraSyncProcessor.resolvePreviousSprintId),
  // Yapılacak = MEVCUT (aktif) sprint.
  // Tamamlanan kutusuna kaynaklik eden kume, onceki sprintin SADECE CANLI
  // is kalemleridir (bkz. LIVE_STATUS_CODE).
  const previousSprintItems = taskLevel.filter(
    (item) => item.previousSprint && item.statusCode === LIVE_STATUS_CODE
  );
  const activeSprintItems = taskLevel.filter((item) => item.activeSprint);

  // Yapılacak İşler AYNEN kaliyor: aktif sprintteki gorev/story'lerin
  // tekillestirilmis ust ogesi (Epic) - bu davranis degismedi, sadece
  // Tamamlanan degisti (bkz. yukaridaki toItemSuggestion notu).
  const current = groupByParent(activeSprintItems);

  const suggestions = { done: [], active: [], risk: [], pending: [] };

  // Yapılacak İşler: aktif sprintte HALA ACIK isi olan Epic'ler (kullanici
  // teyidi 2026-08-20: "Sadece tamamlanmamışlar").
  current.byParent.forEach((epic) => {
    if (epic.openCount === 0) return;
    suggestions.active.push(toSuggestion(epic));
  });

  // Tamamlanan İşler: bir onceki sprintin HER canli is kalemi, tek tek
  // (bkz. toItemSuggestion). Epic'in mevcut sprintte hala acik isi olup
  // olmamasi ARTIK ONEMSIZ - eskiden butun Epic'i gizliyordu. Epic'i takimin
  // KENDI adiyla etiketlenmis (idari/toplanti isi) is kalemleri elenir -
  // bkz. epicLabeledWithOwnTeam.
  let excludedOwnTeamLabel = 0;
  dedupeItems(previousSprintItems).forEach((item) => {
    if (epicLabeledWithOwnTeam(item, jiraProjectKey)) {
      excludedOwnTeamLabel++;
      return;
    }
    suggestions.done.push(toItemSuggestion(item));
  });

  return {
    suggestions,
    stats: {
      previousSprintItemCount: previousSprintItems.length,
      activeSprintItemCount: activeSprintItems.length,
      epicCount: suggestions.active.length,
      withoutParent: current.withoutParent,
      excludedOwnTeamLabel,
    },
  };
}

/**
 * Hedefler bandinin "HEDEFLER" cubugunu (Canlı Süreç Sayısı yeşil / Kalan
 * Süreç Sayısı mavi) work_items'tan hesaplar - bkz. excelParsers.js
 * parseBandTargets'in Excel karsiligi. SADECE bu cubuk Jira'dan turetilebilir:
 * "FTE" cubugu TURETILEMEZ, cunku Jira'da FTE'yi tutan HICBIR alan yok
 * (bkz. /api/jira-discovery/fields taramasi, 2026-08-17).
 *
 * SADECE guncel aktif sprintteki is kalemleri sayilir (item.activeSprint).
 * Takimin board id'si tanimli degilse veya sync henuz sprint bilgisini
 * tasimiyorsa hicbir item activeSprint=true olmaz - bu durumda hedefi tamamen
 * bos gostermek yerine eski (tum backlog) davranisina GERI DUSULUR.
 */
export function buildBandTargetsFromWorkItems(workItems) {
  const items = workItems || [];
  const sprintScoped = items.filter((item) => item.activeSprint);
  const source = sprintScoped.length > 0 ? sprintScoped : items;

  let canli = 0;
  let kalan = 0;
  source.forEach((item) => {
    if (!(item.title || "").trim()) return;
    if (DONE_STATUS_CODES.has(item.statusCode)) canli++;
    else kalan++;
  });
  if (canli + kalan === 0) return [];
  return [
    {
      label: "HEDEFLER",
      segments: [
        { value: String(canli), color: "green" },
        { value: String(kalan), color: "blue" },
      ],
    },
  ];
}
