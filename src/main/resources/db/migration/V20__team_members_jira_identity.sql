-- Jira'dan senkronize edilen is kalemlerinin assignee'sini takim uyeleriyle
-- ESLESTIRMEK yerine ARTIK dogrudan Jira'nin kendi kimligiyle (accountId)
-- takip etmek icin. Eskiden JiraSyncRequestConsumer sadece Jira displayName'i
-- team_members.full_name ile (normalize edilerek) karsilastiriyordu - bu,
-- full_name kaydi eksik/farkli oldugunda (orn. sadece ilk ad girilmis) SESSIZCE
-- eslesmiyor, o kisinin butun isleri "sahipsiz" kaliyordu (canli test, RPA,
-- 2026-08-14: 8 gercek katilimcidan sadece 3'u eslesebiliyordu).
--
-- Referans "Jira Dashboard" projesindeki yaklasim: takim uyeligi hic manuel bir
-- roster'a dayanmiyor, dogrudan Jira issue'larinin assignee'sinden turetiliyor
-- (accountId + displayName + avatarUrl). Ayni yaklasimi burada da uyguluyoruz:
-- jira_account_id, KALICI ve DEGISMEYEN bir kimlik (displayName degisse bile
-- ayni kisiyi gosterir) - JiraSyncRequestConsumer artik once bununla eslestirir,
-- eslesme yoksa (eski/manuel kayitlar icin) email/isim'e duser, hicbiri
-- tutmuyorsa YENI bir TeamMember otomatik olusturur (bkz. o sinifin guncellenmis
-- upsert metodu).
alter table team_members add column jira_account_id varchar(200);
alter table team_members add column avatar_url text;

-- Ayni takimda ayni Jira hesabi icin iki farkli TeamMember satiri olusmasin.
create unique index uq_team_members_team_jira_account
    on team_members (team_id, jira_account_id)
    where jira_account_id is not null;
