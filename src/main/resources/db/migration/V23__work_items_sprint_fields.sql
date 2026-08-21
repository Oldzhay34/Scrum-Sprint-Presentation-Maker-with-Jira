-- İçerik Slaytı'nin "HEDEFLER" cubugu, Jira'dan geldiginde TUM tarihsel
-- backlog'u degil SADECE guncel aktif sprinti yansitsin diye (bkz.
-- JiraSyncRequestConsumer, kullanici bildirimi 2026-08-17: "jiradan bu
-- sprinte özgü olması lazım") her is kaleminin Jira "Sprint" alanindan
-- (customfield_10020) turetilen anlik durumu work_items'a senkronize edilir.
alter table work_items add column sprint_name varchar(200);
alter table work_items add column active_sprint boolean not null default false;
