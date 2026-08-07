-- Ortak (toplu) ve bireysel PPTX indirmelerinin denetim kaydi. Her indirmede
-- yeni bir satir eklenir (insert-only) - "toplu presentation mi bireysel
-- presentation mi indirilmis" bilgisini zaman icinde izlemek icin, tek bir
-- kolon yerine ayri bir tablo tercih edildi (bir presentation birden fazla
-- kez indirilebilir, tek kolon sadece son durumu tutabilirdi).
create table presentation_download_logs (
    id bigint identity(1,1) primary key,
    download_type nvarchar(20) not null,
    team_ids nvarchar(200) not null,
    downloaded_by nvarchar(50) not null,
    downloaded_at datetimeoffset(7) not null default sysutcdatetime()
);
create index idx_presentation_download_logs_downloaded_at on presentation_download_logs(downloaded_at);
