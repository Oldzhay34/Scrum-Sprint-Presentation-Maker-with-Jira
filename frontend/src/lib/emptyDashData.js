/**
 * Henuz hicbir veri kaynagi (Excel/Manuel/Jira) yuklenmemisken/cekilmemisken
 * kullanilan bos "iskelet" dashData - hem canli onizlemede
 * (DashboardSlideCanvas) hem "Düzenle" ekraninda (DashboardEditModal) AYNI
 * sekli kullanir. Boylece "Düzenle"ye basildiginda (henuz veri yokken) modal
 * sessizce hicbir sey acmiyor olmak yerine, dolu dashboard'un BOS/duzenlenebilir
 * bir surumunu acar - kullanici parametreleri doğrudan oradan girebilir (bkz.
 * kullanici bildirimi, 2026-08-17: "manuel giriliyorsa excel yüklenip jira dan
 * çekilmediyse editleye basıldığında boş parametre alma ekranı gelsin").
 */
export function emptyDashData() {
  return {
    team: "Ekip",
    sprintNo: "",
    dateRange: "–",
    reportDate: "–",
    kpis: { toplam: 0, tamamlanan: 0, acik: 0, kapasite: 0, doluluk: 0, acikFazla: 0, durum: "Uygun" },
    persons: [],
    // delta null OLURSA buildSummaryCards (format.js) "Yeni Eklenen İş Yükü" ve
    // "Net İş Yükü Değişimi" kartlarini HIC EKLEMIYOR (kodun kendi yorumu "HER
    // ZAMAN tam 5 sabit kart" diyor ama delta=null iken fiilen 3 kart kaliyordu)
    // - kullanici bildirimi 2026-08-20: "gelen boş şablonda net iş yükü
    // değişimi ve yeni eklenen iş yükü yok". DeltaForm'un baslangic state'iyle
    // (useState("")) AYNI bos degerler - dolu dashboard'daki gibi 5 kart da
    // veri girilmeden once bile gorunur, sadece 0'dan baslar.
    delta: { kapanan: "", eklenen: "", fte: "", net: "", range: "" },
    customKpis: [],
  };
}
