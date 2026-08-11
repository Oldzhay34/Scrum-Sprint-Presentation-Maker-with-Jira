-- Admin ekraninda gorunmesi istenen takimlar + her birine baglanan PO'lar +
-- birkac mock sprint sunumu. Takim ID'leri sabit veriliyor ki
-- MockUserRepositoryAdapter.java'daki teamId/teamIds degerleriyle birebir
-- eslessin (bkz. o dosyanin sinif basi yorumu).

insert into teams (id, name, team_type) overriding system value values
    (1, 'RPA Ekibi', 'RPA'),
    (2, 'İş Zekası Ekibi', 'IS_ZEKASI'),
    (3, 'Ürün Geliştirme Ekibi', 'URUN_GELISTIRME'),
    (4, 'Yapay Zeka Ekibi', 'YAPAY_ZEKA'),
    (5, 'Dijital Uygulamalar Ekibi', 'DIJITAL_UYGULAMALAR'),
    (6, 'Dokuman ve Surec Yonetim Sistemi Ekibi', 'DSYS'),
    (7, 'Konum Tabanlı Ürün Geliştirme (CBS) Ekibi', 'KONUM_TABANLI_URUN_GELISTIRME');
select setval(pg_get_serial_sequence('teams', 'id'), (select max(id) from teams));

insert into team_members (team_id, full_name, role) values
    (1, 'Pelinsu Çevikel', 'PO'),
    (2, 'Ece Sena Salan', 'PO'),
    (3, 'Gözde Son', 'PO'),
    (4, 'Muaz Furkan', 'PO'),
    (5, 'Züleyha Kadeş Tanrıverdi', 'PO'),
    (5, 'Büşra Can', 'PO'),
    (6, 'Alican Özekinci', 'PO');

insert into sprint_presentations (id, team_id, sprint_no, date_range, content, current_version, updated_by) overriding system value values
    (1, 1, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (2, 1, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (3, 2, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (4, 2, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (5, 3, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (6, 3, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (7, 4, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (8, 4, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (9, 5, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (10, 5, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (11, 6, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (12, 6, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed'),
    (13, 7, 'Sprint 6', '10 Temmuz - 24 Temmuz', '{}'::jsonb, 1, 'seed'),
    (14, 7, 'Sprint 7', '24 Temmuz - 7 Ağustos', '{}'::jsonb, 1, 'seed');
select setval(pg_get_serial_sequence('sprint_presentations', 'id'), (select max(id) from sprint_presentations));

insert into sprint_presentation_versions (presentation_id, version, content, updated_by) values
    (1, 1, '{}'::jsonb, 'seed'),
    (2, 1, '{}'::jsonb, 'seed'),
    (3, 1, '{}'::jsonb, 'seed'),
    (4, 1, '{}'::jsonb, 'seed'),
    (5, 1, '{}'::jsonb, 'seed'),
    (6, 1, '{}'::jsonb, 'seed'),
    (7, 1, '{}'::jsonb, 'seed'),
    (8, 1, '{}'::jsonb, 'seed'),
    (9, 1, '{}'::jsonb, 'seed'),
    (10, 1, '{}'::jsonb, 'seed'),
    (11, 1, '{}'::jsonb, 'seed'),
    (12, 1, '{}'::jsonb, 'seed'),
    (13, 1, '{}'::jsonb, 'seed'),
    (14, 1, '{}'::jsonb, 'seed');
