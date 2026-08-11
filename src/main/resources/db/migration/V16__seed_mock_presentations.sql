-- Her takim icin mock sprint sunumu. Amac: bir PO, duzenleme yetkisi olmayan
-- bir takimi sectiginde (bkz. App.jsx/loadTeamPresentation) bos sablon degil,
-- o takimin GERCEK gorunumlu en son sunumunu gorsun.
--
-- Her takima IKI sunum eklenir:
--   sprint 8 -> guncel sprint (zengin icerik + kapasite dashboard'u)
--   sprint 7 -> onceki sprint (daha kisa icerik)
-- Boylece "/api/presentations/latest" mantigi (sprint numarasina gore en
-- yuksek - bkz. PresentationPersistenceAdapter.findLatestPerTeamReadOnly)
-- de test edilebilir hale gelir: her takim icin sprint 8 donmelidir.
--
-- on conflict do nothing: (team_id, sprint_no) benzersiz - gercek kullanicilar
-- tarafindan girilmis bir sunum varsa UZERINE YAZILMAZ, migration tekrar
-- calissa da guvenlidir. Versiyon satiri da yalnizca GERCEKTEN eklenen
-- sunumlar icin olusturulur (bkz. asagidaki "ins" CTE + returning).
with seed(team_id, sprint_no, date_range, updated_by, content) as (
    values
    -- ---------------------------------------------------------------- RPA (1)
    (1::bigint, '8', '07 Ağustos – 21 Ağustos', '37547', '{
      "teamType": "RPA",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Fatura okuma robotu canlıya alındı\nSAP stok mutabakat robotu 3 lokasyonda devreye alındı\nRobot izleme panosuna otomatik hata bildirimi eklendi",
        "active": "Banka ekstre eşleştirme robotu regresyon testinde\nOrchestrator sürüm yükseltmesi için hazırlık yapılıyor",
        "risk": "Lisans yenilemesi gecikirse iki robot durma riski taşıyor",
        "pending": "İK bordro robotu için süreç dokümanı iş biriminden bekleniyor"
      },
      "band": {"show": true, "bars": [
        {"label": "FTE", "segments": [{"value": "8,4", "color": "green"}, {"value": "3,6", "color": "blue"}]},
        {"label": "SÜREÇ", "segments": [{"value": "46", "color": "green"}, {"value": "14", "color": "blue"}]}
      ]},
      "dashSource": "manual",
      "dashData": {
        "team": "RPA Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 128, "tamamlanan": 76, "acik": 52, "kapasite": 58, "doluluk": 0.9, "acikFazla": 6, "durum": "Dikkat"},
        "persons": [
          {"name": "Pelinsu Çevikel", "initials": "PÇ", "role": "Ürün Sorumlusu", "toplam": 34, "tamamlanan": 22, "acik": 12, "kapasite": 15, "doluluk": 0.8, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Mert Aydın", "initials": "MA", "role": "RPA Geliştirici", "toplam": 41, "tamamlanan": 25, "acik": 16, "kapasite": 17, "doluluk": 0.94, "durum": "Dikkat", "bakimOrani": 0.2},
          {"name": "Selin Kaya", "initials": "SK", "role": "RPA Geliştirici", "toplam": 28, "tamamlanan": 19, "acik": 9, "kapasite": 14, "doluluk": 0.64, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Onur Demir", "initials": "OD", "role": "İş Analisti", "toplam": 25, "tamamlanan": 10, "acik": 15, "kapasite": 12, "doluluk": 1.25, "durum": "Yüksek Risk", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 18, "eklenen": 11, "net": -7, "fte": "3,6", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [
          {"label": "FTE Hedef", "value": "12", "unit": "FTE"},
          {"label": "Canlı Süreç Sayısı", "value": "46", "unit": "adet"}
        ],
        "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (1, '7', '24 Temmuz – 07 Ağustos', '37547', '{
      "teamType": "RPA",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Sözleşme arşiv robotu canlıya alındı\nRobot çalışma logları merkezi izleme sistemine bağlandı",
        "active": "Fatura okuma robotu kullanıcı kabul testinde",
        "risk": "Kaynak sistemdeki ekran değişiklikleri iki robotu etkiledi",
        "pending": "Yeni süreç talepleri önceliklendirme bekliyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "RPA Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 119, "tamamlanan": 64, "acik": 55, "kapasite": 58, "doluluk": 0.95, "acikFazla": 3, "durum": "Dikkat"},
        "persons": [
          {"name": "Pelinsu Çevikel", "initials": "PÇ", "role": "Ürün Sorumlusu", "toplam": 32, "tamamlanan": 18, "acik": 14, "kapasite": 15, "doluluk": 0.93, "durum": "Dikkat", "bakimOrani": 0.2},
          {"name": "Mert Aydın", "initials": "MA", "role": "RPA Geliştirici", "toplam": 39, "tamamlanan": 21, "acik": 18, "kapasite": 17, "doluluk": 1.06, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- ---------------------------------------------------------- İş Zekası (2)
    (2, '8', '07 Ağustos – 21 Ağustos', '30816', '{
      "teamType": "IS_ZEKASI",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Satış performans dashboardu yayına alındı\nÜretim OEE raporu Power BI servisine taşındı\nGünlük veri yükleme süresi 40 dakikadan 12 dakikaya indirildi",
        "active": "Finans konsolidasyon modelinin veri doğrulaması sürüyor\nRapor erişim yetkileri rol bazlı olarak yeniden düzenleniyor",
        "risk": "Kaynak sistemdeki gecikmeli veri akışı gece yüklemelerini riske atıyor",
        "pending": "Tedarik zinciri raporu için iş birimi gereksinimleri bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "İş Zekası Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 96, "tamamlanan": 61, "acik": 35, "kapasite": 44, "doluluk": 0.8, "acikFazla": 9, "durum": "Uygun"},
        "persons": [
          {"name": "Ece Sena Salan", "initials": "ES", "role": "Ürün Sorumlusu", "toplam": 30, "tamamlanan": 21, "acik": 9, "kapasite": 15, "doluluk": 0.6, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Burak Yılmaz", "initials": "BY", "role": "BI Geliştirici", "toplam": 38, "tamamlanan": 23, "acik": 15, "kapasite": 16, "doluluk": 0.94, "durum": "Dikkat", "bakimOrani": 0.2},
          {"name": "Deniz Arslan", "initials": "DA", "role": "Veri Analisti", "toplam": 28, "tamamlanan": 17, "acik": 11, "kapasite": 13, "doluluk": 0.85, "durum": "Dikkat", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 14, "eklenen": 9, "net": -5, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (2, '7', '24 Temmuz – 07 Ağustos', '30816', '{
      "teamType": "IS_ZEKASI",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Stok devir hızı raporu yayına alındı\nVeri ambarı yedekleme prosedürü güncellendi",
        "active": "Satış performans dashboardu son kullanıcı testinde",
        "risk": "Rapor kaynak tablolarında tekilleştirme sorunu inceleniyor",
        "pending": "Yeni KPI tanımları için finans ekibinden onay bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "İş Zekası Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 88, "tamamlanan": 52, "acik": 36, "kapasite": 44, "doluluk": 0.82, "acikFazla": 8, "durum": "Uygun"},
        "persons": [
          {"name": "Ece Sena Salan", "initials": "ES", "role": "Ürün Sorumlusu", "toplam": 29, "tamamlanan": 18, "acik": 11, "kapasite": 15, "doluluk": 0.73, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Burak Yılmaz", "initials": "BY", "role": "BI Geliştirici", "toplam": 34, "tamamlanan": 20, "acik": 14, "kapasite": 16, "doluluk": 0.88, "durum": "Dikkat", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- --------------------------------------------------- Ürün Geliştirme (3)
    (3, '8', '07 Ağustos – 21 Ağustos', '29547', '{
      "teamType": "URUN_GELISTIRME",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Sprint sunum modülü canlıya alındı\nOrtak sunum ekranında çoklu takım önizlemesi tamamlandı\nPPTX çıktısında koyu tema desteği eklendi",
        "active": "Kapasite dashboardu manuel giriş akışı iyileştiriliyor\nSürüm geçmişi ve geri alma ekranı geliştiriliyor",
        "risk": "Excel şablon farklılıkları içe aktarmada hataya yol açabiliyor",
        "pending": "Yeni tema talepleri için tasarım onayı bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Ürün Geliştirme Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 142, "tamamlanan": 88, "acik": 54, "kapasite": 62, "doluluk": 0.87, "acikFazla": 8, "durum": "Dikkat"},
        "persons": [
          {"name": "Gözde Son", "initials": "GS", "role": "Ürün Sorumlusu", "toplam": 32, "tamamlanan": 24, "acik": 8, "kapasite": 15, "doluluk": 0.53, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Aslı Yarım", "initials": "AY", "role": "Yazılım Geliştirici", "toplam": 44, "tamamlanan": 27, "acik": 17, "kapasite": 17, "doluluk": 1.0, "durum": "Risk", "bakimOrani": 0.2},
          {"name": "Emre Koç", "initials": "EK", "role": "Yazılım Geliştirici", "toplam": 40, "tamamlanan": 25, "acik": 15, "kapasite": 17, "doluluk": 0.88, "durum": "Dikkat", "bakimOrani": 0.2},
          {"name": "Ceyda Uçar", "initials": "CU", "role": "Test Uzmanı", "toplam": 26, "tamamlanan": 12, "acik": 14, "kapasite": 13, "doluluk": 1.08, "durum": "Risk", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 21, "eklenen": 16, "net": -5, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- Ürün Geliştirme sprint 7: takimin gercek/kullanici tarafindan girilmis
    -- bir kaydi zaten olabilir - o zaman bu satir "on conflict" ile atlanir.
    (3, '7', '24 Temmuz – 07 Ağustos', '29547', '{
      "teamType": "URUN_GELISTIRME",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Kapak sayfası sihirbazı tamamlandı\nSunum süresi geri sayımı önizlemeye eklendi",
        "active": "Sprint sunum modülü kabul testinde",
        "risk": "Tarayıcı bazlı PPTX üretiminde performans sorunları izleniyor",
        "pending": "Ortak sunum ekranı için yetki kuralları netleştirilecek"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Ürün Geliştirme Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 131, "tamamlanan": 74, "acik": 57, "kapasite": 62, "doluluk": 0.92, "acikFazla": 5, "durum": "Dikkat"},
        "persons": [
          {"name": "Gözde Son", "initials": "GS", "role": "Ürün Sorumlusu", "toplam": 30, "tamamlanan": 20, "acik": 10, "kapasite": 15, "doluluk": 0.67, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Aslı Yarım", "initials": "AY", "role": "Yazılım Geliştirici", "toplam": 42, "tamamlanan": 23, "acik": 19, "kapasite": 17, "doluluk": 1.12, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- --------------------------------------------------------- Yapay Zeka (4)
    (4, '8', '07 Ağustos – 21 Ağustos', '33603', '{
      "teamType": "YAPAY_ZEKA",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Doküman soru-cevap asistanı pilot kullanıma açıldı\nModel yanıt kalitesi için değerlendirme seti oluşturuldu\nVektör veritabanı üretim ortamına kuruldu",
        "active": "Bakım tahmin modeli yeni veri setiyle yeniden eğitiliyor\nAsistan için kurumsal içerik indeksleme akışı geliştiriliyor",
        "risk": "GPU kaynağı paylaşımlı olduğu için eğitim süreleri öngörülemiyor",
        "pending": "Veri gizliliği değerlendirmesi hukuk biriminden bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Yapay Zeka Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 84, "tamamlanan": 47, "acik": 37, "kapasite": 40, "doluluk": 0.93, "acikFazla": 3, "durum": "Dikkat"},
        "persons": [
          {"name": "Muaz Furkan", "initials": "MF", "role": "Ürün Sorumlusu", "toplam": 26, "tamamlanan": 17, "acik": 9, "kapasite": 14, "doluluk": 0.64, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "İrem Şahin", "initials": "İŞ", "role": "Veri Bilimci", "toplam": 33, "tamamlanan": 18, "acik": 15, "kapasite": 14, "doluluk": 1.07, "durum": "Risk", "bakimOrani": 0.2},
          {"name": "Kaan Öztürk", "initials": "KÖ", "role": "ML Mühendisi", "toplam": 25, "tamamlanan": 12, "acik": 13, "kapasite": 12, "doluluk": 1.08, "durum": "Risk", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 12, "eklenen": 15, "net": 3, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (4, '7', '24 Temmuz – 07 Ağustos', '33603', '{
      "teamType": "YAPAY_ZEKA",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Model servis altyapısı konteynerleştirildi\nEtiketleme arayüzü iç kullanıma açıldı",
        "active": "Doküman soru-cevap asistanı pilot hazırlığı",
        "risk": "Etiketli veri miktarı hedefin altında kaldı",
        "pending": "Üretim verisi erişim talebi onay bekliyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Yapay Zeka Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 78, "tamamlanan": 41, "acik": 37, "kapasite": 40, "doluluk": 0.95, "acikFazla": 3, "durum": "Dikkat"},
        "persons": [
          {"name": "Muaz Furkan", "initials": "MF", "role": "Ürün Sorumlusu", "toplam": 25, "tamamlanan": 15, "acik": 10, "kapasite": 14, "doluluk": 0.71, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "İrem Şahin", "initials": "İŞ", "role": "Veri Bilimci", "toplam": 31, "tamamlanan": 15, "acik": 16, "kapasite": 14, "doluluk": 1.14, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- ----------------------------------------------- Dijital Uygulamalar (5)
    (5, '8', '07 Ağustos – 21 Ağustos', '35840', '{
      "teamType": "DIJITAL_UYGULAMALAR",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Saha uygulaması mobil sürümü mağazaya yüklendi\nTek oturum açma entegrasyonu tamamlandı\nBildirim altyapısı yeni servise taşındı",
        "active": "Vardiya planlama ekranı kullanıcı testinde\nUygulama içi geri bildirim modülü geliştiriliyor",
        "risk": "Eski cihazlarda performans sorunları raporlandı",
        "pending": "Saha ekiplerinden kullanım senaryoları bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Dijital Uygulamalar Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 112, "tamamlanan": 70, "acik": 42, "kapasite": 52, "doluluk": 0.81, "acikFazla": 10, "durum": "Uygun"},
        "persons": [
          {"name": "Züleyha Kadeş Tanrıverdi", "initials": "ZT", "role": "Ürün Sorumlusu", "toplam": 31, "tamamlanan": 22, "acik": 9, "kapasite": 15, "doluluk": 0.6, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Büşra Can", "initials": "BC", "role": "Ürün Sorumlusu", "toplam": 27, "tamamlanan": 18, "acik": 9, "kapasite": 12, "doluluk": 0.75, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Tolga Eren", "initials": "TE", "role": "Mobil Geliştirici", "toplam": 33, "tamamlanan": 19, "acik": 14, "kapasite": 14, "doluluk": 1.0, "durum": "Risk", "bakimOrani": 0.2},
          {"name": "Nazlı Güneş", "initials": "NG", "role": "Arayüz Geliştirici", "toplam": 21, "tamamlanan": 11, "acik": 10, "kapasite": 11, "doluluk": 0.91, "durum": "Dikkat", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 17, "eklenen": 12, "net": -5, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (5, '7', '24 Temmuz – 07 Ağustos', '35840', '{
      "teamType": "DIJITAL_UYGULAMALAR",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Kullanıcı yetkilendirme ekranları yenilendi\nUygulama loglama altyapısı devreye alındı",
        "active": "Saha uygulaması mobil sürüm hazırlığı",
        "risk": "Mağaza onay süreci yayın tarihini geciktirebilir",
        "pending": "Yeni ekran tasarımları için onay bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Dijital Uygulamalar Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 104, "tamamlanan": 58, "acik": 46, "kapasite": 52, "doluluk": 0.88, "acikFazla": 6, "durum": "Dikkat"},
        "persons": [
          {"name": "Züleyha Kadeş Tanrıverdi", "initials": "ZT", "role": "Ürün Sorumlusu", "toplam": 29, "tamamlanan": 17, "acik": 12, "kapasite": 15, "doluluk": 0.8, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Tolga Eren", "initials": "TE", "role": "Mobil Geliştirici", "toplam": 31, "tamamlanan": 16, "acik": 15, "kapasite": 14, "doluluk": 1.07, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- ---------------------------------------------------------------- DSYS (6)
    (6, '8', '07 Ağustos – 21 Ağustos', '25493', '{
      "teamType": "DSYS",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Doküman onay akışı yeni sürümüyle canlıya alındı\nKalite dokümanları için sürüm karşılaştırma ekranı eklendi\nArşiv tarama performansı iki kat iyileştirildi",
        "active": "Elektronik imza entegrasyonu test ediliyor\nSüreç şablonları yeniden yapılandırılıyor",
        "risk": "Eski dokümanların taşınmasında meta veri eksikleri var",
        "pending": "Kalite biriminden güncellenmiş süreç listesi bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Doküman ve Süreç Yönetim Sistemi Ekibi", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 74, "tamamlanan": 48, "acik": 26, "kapasite": 34, "doluluk": 0.76, "acikFazla": 8, "durum": "Uygun"},
        "persons": [
          {"name": "Alican Özekinci", "initials": "AÖ", "role": "Ürün Sorumlusu", "toplam": 28, "tamamlanan": 19, "acik": 9, "kapasite": 14, "doluluk": 0.64, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Hakan Turan", "initials": "HT", "role": "Sistem Uzmanı", "toplam": 26, "tamamlanan": 17, "acik": 9, "kapasite": 11, "doluluk": 0.82, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Merve Aksoy", "initials": "MA", "role": "Süreç Analisti", "toplam": 20, "tamamlanan": 12, "acik": 8, "kapasite": 9, "doluluk": 0.89, "durum": "Dikkat", "bakimOrani": 0.15}
        ],
        "delta": {"kapanan": 10, "eklenen": 7, "net": -3, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (6, '7', '24 Temmuz – 07 Ağustos', '25493', '{
      "teamType": "DSYS",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Doküman numaralandırma standardı uygulandı\nYetki matrisi güncellendi",
        "active": "Doküman onay akışı yeni sürüm testleri",
        "risk": "Kullanıcı eğitimleri planlanandan geç başladı",
        "pending": "Arşiv taşıma takvimi netleşmedi"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Doküman ve Süreç Yönetim Sistemi Ekibi", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 68, "tamamlanan": 39, "acik": 29, "kapasite": 34, "doluluk": 0.85, "acikFazla": 5, "durum": "Dikkat"},
        "persons": [
          {"name": "Alican Özekinci", "initials": "AÖ", "role": "Ürün Sorumlusu", "toplam": 26, "tamamlanan": 15, "acik": 11, "kapasite": 14, "doluluk": 0.79, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Hakan Turan", "initials": "HT", "role": "Sistem Uzmanı", "toplam": 24, "tamamlanan": 13, "acik": 11, "kapasite": 11, "doluluk": 1.0, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    -- ------------------------------- Konum Tabanlı Ürün Geliştirme / CBS (7)
    (7, '8', '07 Ağustos – 21 Ağustos', '35834', '{
      "teamType": "KONUM_TABANLI_URUN_GELISTIRME",
      "sprint": "8",
      "range": "07 Ağustos – 21 Ağustos",
      "sections": {
        "done": "Abone konum doğrulama servisi canlıya alındı\nHarita altlıkları güncel uydu görüntüleriyle yenilendi\nSaha ekipleri için konum tabanlı görev atama ekranı tamamlandı",
        "active": "Şebeke varlık envanteri harita katmanı geliştiriliyor\nKonum verisi doğruluk analizi sürüyor",
        "risk": "Harita servis sağlayıcısının kota limiti yoğun kullanımda aşılabilir",
        "pending": "Saha ölçüm verilerinin aktarım formatı netleşmedi"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Konum Tabanlı Ürün Geliştirme Ekibi (CBS)", "sprintNo": "8", "dateRange": "07.08.2026 – 21.08.2026", "reportDate": "10.08.2026",
        "kpis": {"toplam": 91, "tamamlanan": 55, "acik": 36, "kapasite": 42, "doluluk": 0.86, "acikFazla": 6, "durum": "Dikkat"},
        "persons": [
          {"name": "Büşra Can", "initials": "BC", "role": "Ürün Sorumlusu", "toplam": 29, "tamamlanan": 19, "acik": 10, "kapasite": 13, "doluluk": 0.77, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Züleyha Kadeş Tanrıverdi", "initials": "ZT", "role": "Ürün Sorumlusu", "toplam": 24, "tamamlanan": 16, "acik": 8, "kapasite": 11, "doluluk": 0.73, "durum": "Uygun", "bakimOrani": 0.2},
          {"name": "Serkan Balcı", "initials": "SB", "role": "CBS Uzmanı", "toplam": 38, "tamamlanan": 20, "acik": 18, "kapasite": 18, "doluluk": 1.0, "durum": "Risk", "bakimOrani": 0.2}
        ],
        "delta": {"kapanan": 13, "eklenen": 10, "net": -3, "fte": "", "range": "27.07.2026 – 10.08.2026"},
        "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb),
    (7, '7', '24 Temmuz – 07 Ağustos', '35834', '{
      "teamType": "KONUM_TABANLI_URUN_GELISTIRME",
      "sprint": "7",
      "range": "24 Temmuz – 07 Ağustos",
      "sections": {
        "done": "Harita altyapısı yeni sürüme yükseltildi\nKoordinat dönüşüm servisi devreye alındı",
        "active": "Abone konum doğrulama servisi kabul testinde",
        "risk": "Adres veri kalitesi bazı bölgelerde düşük",
        "pending": "Saha ekipleri için cihaz tedariki bekleniyor"
      },
      "band": {"show": false, "bars": []},
      "dashSource": "manual",
      "dashData": {
        "team": "Konum Tabanlı Ürün Geliştirme Ekibi (CBS)", "sprintNo": "7", "dateRange": "24.07.2026 – 07.08.2026", "reportDate": "07.08.2026",
        "kpis": {"toplam": 83, "tamamlanan": 45, "acik": 38, "kapasite": 42, "doluluk": 0.9, "acikFazla": 4, "durum": "Dikkat"},
        "persons": [
          {"name": "Büşra Can", "initials": "BC", "role": "Ürün Sorumlusu", "toplam": 27, "tamamlanan": 15, "acik": 12, "kapasite": 13, "doluluk": 0.92, "durum": "Dikkat", "bakimOrani": 0.2},
          {"name": "Serkan Balcı", "initials": "SB", "role": "CBS Uzmanı", "toplam": 35, "tamamlanan": 18, "acik": 17, "kapasite": 18, "doluluk": 0.94, "durum": "Dikkat", "bakimOrani": 0.2}
        ],
        "delta": null, "customKpis": [], "tableHeaders": null
      },
      "timerMinutes": 5
    }'::jsonb)
),
ins as (
    insert into sprint_presentations (team_id, sprint_no, date_range, content, current_version, updated_by)
    select team_id, sprint_no, date_range, content, 1, updated_by from seed
    on conflict (team_id, sprint_no) do nothing
    returning id, content, updated_by
)
insert into sprint_presentation_versions (presentation_id, version, content, updated_by)
select id, 1, content, updated_by from ins;
