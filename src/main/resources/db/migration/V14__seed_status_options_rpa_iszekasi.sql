-- status_options tablosu bostu - hicbir takim icin statu tanimli olmadigindan
-- V8'deki chk_work_items_status_code / chk_team_members_status_code kontrolu
-- HER satiri reddediyordu (Jira senkronizasyonunda 2195/2195 issue basarisiz
-- oldu - bkz. audit_log JIRA_SYNC_RESULT kaydi). Statuler team_id'ye ozel
-- eklenir (global/team_id IS NULL DEGIL), cunku "Tamamlanan/Düşen Statü"
-- kumesi takima gore FARKLI (bkz. Excel Parametreler sayfasi):
--   RPA               -> Canlı, Canlıda/Y, İptal
--   İş Zekası         -> Canlı, UAT, Devam Ediyor, Analiz
-- Kod listesi her iki Excel'deki ortak "Listeler" sayfasindan birebir alinir.

insert into status_options (team_id, code, label, counts_as_completed, sort_order) values
    (1, 'Backlog', 'Backlog', false, 1),
    (1, 'Beklemede', 'Beklemede', false, 2),
    (1, 'Analiz Havuzu', 'Analiz Havuzu', false, 3),
    (1, 'Analiz Onayı', 'Analiz Onayı', false, 4),
    (1, 'Ön Analiz', 'Ön Analiz', false, 5),
    (1, 'Analiz', 'Analiz', false, 6),
    (1, 'Geliştirme Havuzu', 'Geliştirme Havuzu', false, 7),
    (1, 'Geliştirme', 'Geliştirme', false, 8),
    (1, 'Müşteri Bekleniyor', 'Müşteri Bekleniyor', false, 9),
    (1, 'UAT', 'UAT', false, 10),
    (1, 'Devam Ediyor', 'Devam Ediyor', false, 11),
    (1, 'Canlı', 'Canlı', true, 12),
    (1, 'Canlıda/Y', 'Canlıda/Y', true, 13),
    (1, 'İptal', 'İptal', true, 14);

insert into status_options (team_id, code, label, counts_as_completed, sort_order) values
    (2, 'Backlog', 'Backlog', false, 1),
    (2, 'Beklemede', 'Beklemede', false, 2),
    (2, 'Analiz Havuzu', 'Analiz Havuzu', false, 3),
    (2, 'Analiz Onayı', 'Analiz Onayı', false, 4),
    (2, 'Ön Analiz', 'Ön Analiz', false, 5),
    (2, 'Analiz', 'Analiz', true, 6),
    (2, 'Geliştirme Havuzu', 'Geliştirme Havuzu', false, 7),
    (2, 'Geliştirme', 'Geliştirme', false, 8),
    (2, 'Müşteri Bekleniyor', 'Müşteri Bekleniyor', false, 9),
    (2, 'UAT', 'UAT', true, 10),
    (2, 'Devam Ediyor', 'Devam Ediyor', true, 11),
    (2, 'Canlı', 'Canlı', true, 12),
    (2, 'Canlıda/Y', 'Canlıda/Y', true, 13),
    (2, 'İptal', 'İptal', false, 14);
