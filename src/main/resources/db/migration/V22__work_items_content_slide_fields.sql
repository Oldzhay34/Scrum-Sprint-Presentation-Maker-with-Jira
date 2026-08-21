-- İçerik Slaytı'nın "Jira'dan Çek" ile otomatik dolmasi icin: Jira'nin
-- "Flagged" (customfield_10021, Riskler kutusunu belirler), "Sektör"
-- (customfield_10498) ve standart "priority" alanlari artik work_items'a
-- senkronize edilir (bkz. JiraSyncRequestConsumer, kullanici bildirimi
-- 2026-08-17).
alter table work_items add column flagged boolean not null default false;
alter table work_items add column sector varchar(200);
alter table work_items add column priority varchar(50);
