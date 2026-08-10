-- Genel aktivite/monitoring logu: sistemdeki tum mutasyon isteklerini
-- (POST/PUT/PATCH/DELETE) AuditLogInterceptor otomatik olarak buraya yazar
-- (bkz. monitoring/interceptor/AuditLogInterceptor.java). Hicbir mevcut
-- controller/service dokunulmadan, merkezi bir interceptor uzerinden
-- calisir - "kim ne zaman ne yapti" kaydi.
create table audit_log (
    id bigint generated always as identity primary key,
    actor_sicil varchar(50),
    actor_name varchar(200),
    actor_role varchar(20),
    http_method varchar(10) not null,
    action_code varchar(60) not null,
    action_label varchar(200) not null,
    entity_type varchar(60),
    entity_id varchar(60),
    team_id bigint,
    status_code int not null,
    success boolean not null,
    created_at timestamptz not null default now()
);
create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_audit_log_actor_sicil on audit_log(actor_sicil);
create index idx_audit_log_team_id on audit_log(team_id);
create index idx_audit_log_action_code on audit_log(action_code);

-- Insert-only guvencesi: uygulama katmani zaten hic UPDATE/DELETE calistirmiyor
-- (bkz. AuditLogRepositoryPort - sadece save/find metodlari var), ama bu
-- trigger ayni kurali veritabani seviyesinde de zorunlu kilar - dogrudan SQL
-- ile yapilacak bir mudahale (kotu niyetli ya da yanlislikla) dahi
-- audit_log satirlarini degistiremez/silemez.
create function trg_audit_log_immutable_fn()
returns trigger
language plpgsql
as $$
begin
    raise exception 'audit_log kayitlari degistirilemez veya silinemez (insert-only).';
end;
$$;

create trigger trg_audit_log_immutable
    before update or delete on audit_log
    for each row
    execute function trg_audit_log_immutable_fn();
