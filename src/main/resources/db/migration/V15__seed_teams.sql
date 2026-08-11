-- Mock/demo takim listesi. id degerleri MockUserRepositoryAdapter'daki
-- teamId/teamIds alanlariyla BIREBIR eslesir - bu yuzden sabit id ile
-- (overriding system value) eklenir, identity'nin uretecegi siraya
-- birakilmaz. Yeni takim eklenirse hem burasi hem MockUserRepositoryAdapter
-- guncellenmelidir.
--
--   1 RPA Ekibi                                  -> 37547 Pelinsu Çevikel
--   2 İş Zekası Ekibi                            -> 30816 Ece Sena Salan
--   3 Ürün Geliştirme Ekibi                      -> 29547 Gözde Son
--   4 Yapay Zeka Ekibi                           -> 33603 Muaz Furkan
--   5 Dijital Uygulamalar Ekibi                  -> 35840 Züleyha Kadeş Tanrıverdi, 35834 Büşra Can
--   6 Doküman ve Süreç Yönetim Sistemi Ekibi     -> 25493 Alican Özekinci
--   7 Konum Tabanlı Ürün Geliştirme Ekibi (CBS)  -> 35840 Züleyha Kadeş Tanrıverdi, 35834 Büşra Can
--
-- on conflict do nothing: elde zaten o id ile takim varsa (ornegin DB'de
-- manuel olusturulmus) uzerine yazilmaz, migration tekrar calissa da guvenli.
insert into teams (id, name, description, maintenance_allocation_percent, team_type)
overriding system value
values
    (1, 'RPA Ekibi',                                 'Robotik Süreç Otomasyonu ekibi',            0, 'RPA'),
    (2, 'İş Zekası Ekibi',                           'İş Zekası ve raporlama ekibi',              0, 'IS_ZEKASI'),
    (3, 'Ürün Geliştirme Ekibi',                     'Ürün geliştirme ekibi',                     0, 'URUN_GELISTIRME'),
    (4, 'Yapay Zeka Ekibi',                          'Yapay zeka ve makine öğrenmesi ekibi',      0, 'YAPAY_ZEKA'),
    (5, 'Dijital Uygulamalar Ekibi',                 'Dijital uygulamalar ekibi',                 0, 'DIJITAL_UYGULAMALAR'),
    (6, 'Doküman ve Süreç Yönetim Sistemi Ekibi',    'Doküman ve süreç yönetim sistemi ekibi',    0, 'DSYS'),
    (7, 'Konum Tabanlı Ürün Geliştirme Ekibi (CBS)', 'Konum tabanlı (CBS) ürün geliştirme ekibi', 0, 'KONUM_TABANLI_URUN_GELISTIRME')
on conflict (id) do nothing;

-- Sabit id'lerle ekleme yaptigimiz icin identity sayaci hala 1'i gosteriyor;
-- ilerideki "normal" takim eklemelerinde cakisma olmamasi icin ileri sariyoruz.
select setval(pg_get_serial_sequence('teams', 'id'), coalesce((select max(id) from teams), 1));
