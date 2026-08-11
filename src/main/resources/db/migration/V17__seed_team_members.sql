-- origin/efe-dev'den gelen bu migration'in TEAMS ve SPRINT_PRESENTATIONS kismi
-- V15__seed_teams.sql ve V16__seed_mock_presentations.sql ile CAKISIYORDU
-- (ayni id'lerle, ama "on conflict" korumasi olmadan) - iki farkli dal (asli-dev,
-- efe-dev) birbirinden habersiz ayni demo-seed isini yapmis. teams kismi zaten
-- V15'te (on conflict do nothing ile) var; sprint_presentations kismi ise sabit
-- id (1-14, overriding system value) kullandigi icin V16'nin identity ile
-- olusturdugu satirlarla PRIMARY KEY cakismasi yaratirdi. Sadece bu iki dalda da
-- OLMAYAN, gercekten yeni olan kisim (team_members) burada birakildi.
--
-- Takim ID'leri MockUserRepositoryAdapter.java'daki teamId/teamIds degerleriyle
-- birebir eslesir (bkz. o dosyanin sinif basi yorumu, V15'te de ayni not var).
insert into team_members (team_id, full_name, role) values
    (1, 'Pelinsu Çevikel', 'PO'),
    (2, 'Ece Sena Salan', 'PO'),
    (3, 'Gözde Son', 'PO'),
    (4, 'Muaz Furkan', 'PO'),
    (5, 'Züleyha Kadeş Tanrıverdi', 'PO'),
    (5, 'Büşra Can', 'PO'),
    (6, 'Alican Özekinci', 'PO');
