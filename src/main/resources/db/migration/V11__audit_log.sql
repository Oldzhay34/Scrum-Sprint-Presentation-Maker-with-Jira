-- Genel aktivite/monitoring logu: sistemdeki tum mutasyon isteklerini
-- (POST/PUT/PATCH/DELETE) AuditLogInterceptor otomatik olarak buraya yazar
-- (bkz. monitoring/interceptor/AuditLogInterceptor.java). Hicbir mevcut
-- controller/service dokunulmadan, merkezi bir interceptor uzerinden
-- calisir - "kim ne zaman ne yapti" kaydi.
create table audit_log (
    id bigint identity(1,1) primary key,
    actor_sicil nvarchar(50),
    actor_name nvarchar(200),
    actor_role nvarchar(20),
    http_method nvarchar(10) not null,
    action_code nvarchar(60) not null,
    action_label nvarchar(200) not null,
    entity_type nvarchar(60),
    entity_id nvarchar(60),
    team_id bigint,
    status_code int not null,
    success bit not null,
    created_at datetimeoffset(7) not null default sysutcdatetime()
);
create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_audit_log_actor_sicil on audit_log(actor_sicil);
create index idx_audit_log_team_id on audit_log(team_id);
create index idx_audit_log_action_code on audit_log(action_code);
go

-- Insert-only guvencesi: uygulama katmani zaten hic UPDATE/DELETE calistirmiyor
-- (bkz. AuditLogRepositoryPort - sadece save/find metodlari var), ama bu
-- trigger ayni kurali veritabani seviyesinde de zorunlu kilar - dogrudan SQL
-- ile yapilacak bir mudahale (kotu niyetli ya da yanlislikla) dahi
-- audit_log satirlarini degistiremez/silemez.
create trigger trg_audit_log_immutable
on audit_log
instead of update, delete
as
begin
    set nocount on;
    raiserror('audit_log kayitlari degistirilemez veya silinemez (insert-only).', 16, 1);
    rollback transaction;
end;
go
