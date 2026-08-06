-- 1NF duzeltmesi: presentation_download_logs.team_ids virgulle ayrilmis
-- string olarak (tekrarlayan grup) saklaniyordu. Tablo yeni oldugu ve veri
-- icermedigi icin veri tasima gerekmeden dogrudan ayri bir junction tabloya
-- bolunuyor.
create table presentation_download_log_teams (
    download_log_id bigint not null references presentation_download_logs(id) on delete cascade,
    team_id bigint not null references teams(id) on delete cascade,
    primary key (download_log_id, team_id)
);

alter table presentation_download_logs drop column team_ids;
