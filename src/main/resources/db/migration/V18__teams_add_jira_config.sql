-- Takimin Jira proje anahtari ve board id'si - jira-sync tetiklerken
-- her seferinde elle girilmesine gerek kalmamasi icin takima sabitlenir.
-- Board id'leri full-audit.json (kullanicinin harici dogrulama raporu)
-- uzerinden canli olarak dogrulanmis degerlerdir.
alter table teams add column jira_project_key varchar(50);
alter table teams add column jira_board_id bigint;

update teams set jira_project_key = 'RPA',  jira_board_id = 538  where id = 1; -- RPA Ekibi
update teams set jira_project_key = 'IZ',   jira_board_id = 1669 where id = 2; -- Is Zekasi Ekibi
update teams set jira_project_key = 'SD',   jira_board_id = 1036 where id = 3; -- Urun Gelistirme Ekibi
update teams set jira_project_key = 'YZ',   jira_board_id = 1335 where id = 4; -- Yapay Zeka Ekibi
update teams set jira_project_key = 'DA',   jira_board_id = 1203 where id = 5; -- Dijital Uygulamalar Ekibi
update teams set jira_project_key = 'DSYS', jira_board_id = 1071 where id = 6; -- Dokuman ve Surec Yonetim Sistemi Ekibi
-- id = 7 (Konum Tabanli Urun Gelistirme Ekibi / CBS): Jira'da henuz karsiligi
-- yok (full-audit.json'da bu takim icin board bulunamadi) - bilerek bos birakilir.
