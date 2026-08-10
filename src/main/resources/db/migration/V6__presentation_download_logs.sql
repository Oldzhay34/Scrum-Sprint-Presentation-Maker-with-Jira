-- Ortak (toplu) ve bireysel PPTX indirmelerinin denetim kaydi. Her indirmede
-- yeni bir satir eklenir (insert-only) - "toplu presentation mi bireysel
-- presentation mi indirilmis" bilgisini zaman icinde izlemek icin, tek bir
-- kolon yerine ayri bir tablo tercih edildi (bir presentation birden fazla
-- kez indirilebilir, tek kolon sadece son durumu tutabilirdi).
create table presentation_download_logs (
    id bigint generated always as identity primary key,
    download_type varchar(20) not null,
    team_ids varchar(200) not null,
    downloaded_by varchar(50) not null,
    downloaded_at timestamptz not null default now()
);
create index idx_presentation_download_logs_downloaded_at on presentation_download_logs(downloaded_at);
