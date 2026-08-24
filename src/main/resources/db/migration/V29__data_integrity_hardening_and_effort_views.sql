-- V13'un devami: tam sema taramasinda (2026-08-21) tespit edilen ek veri
-- butunlugu eksikleri + iki yeni raporlama view'i. Semanin tamami zaten
-- buyuk olcude normalize (bkz. V7/V9 - 1NF EAV/junction table duzeltmeleri,
-- V8/V13 - status_code referans butunlugu). Burada normalize EDILMEYEN,
-- BILEREK oyle birakilan iki nokta var - onlar icin ayri not asagida:
--
--   1) work_items.sprint_name/sprint_start_date/sprint_end_date/active_sprint/
--      previous_sprint her satirda TEKRARLANIYOR (bir "sprints" tablosu yok).
--   2) work_items.parent_title/parent_labels/issue_type (Epic'e ait alanlar)
--      her alt is kalemi satirinda TEKRARLANIYOR (bir "epics" tablosu yok).
--
--   Ikisi de klasik 3NF ihlali (transitive dependency) AMA bilerek boyle:
--   JiraSyncProcessor bu alanlari HER senkronizasyonda Jira'dan gelen
--   issue/parent JSON'undan direkt yaziyor (bkz. o sinifin V23/V27/V28
--   yorumlari), "sprints"/"epics" tablosu ayirmak o senkronizasyon
--   mantiginin (upsert, epic sektor/label cozumleme, onceki sprint tespiti)
--   BASTAN yazilmasi demek - canli, az once RabbitMQ'dan cikarilip @Async'e
--   tasinmis bir akisi, olcumlenmis bir performans sorunu OLMADAN yeniden
--   riske atmaya degmez. Bu yuzden burada DOKUNULMADI - ayri bir karar
--   olarak degerlendirilmeli.

-- ============================================================
-- 1) updated_at hicbir tabloda DB seviyesinde bakimi yapilmiyor - sadece
--    Hibernate'in @UpdateTimestamp'i (uygulama katmani) guncelliyor. Migration
--    scriptleri veya ileride baska bir servisin dogrudan UPDATE'i bu alani
--    atlarsa "en son ne zaman degisti" sessizce yanlis kalir. Tek bir genel
--    fonksiyon + ilgili 7 tabloda BEFORE UPDATE tetikleyicisi.
-- ============================================================
create function set_updated_at_fn()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger trg_teams_set_updated_at
    before update on teams
    for each row execute function set_updated_at_fn();

create trigger trg_team_members_set_updated_at
    before update on team_members
    for each row execute function set_updated_at_fn();

create trigger trg_status_options_set_updated_at
    before update on status_options
    for each row execute function set_updated_at_fn();

create trigger trg_team_custom_field_definitions_set_updated_at
    before update on team_custom_field_definitions
    for each row execute function set_updated_at_fn();

create trigger trg_leave_periods_set_updated_at
    before update on leave_periods
    for each row execute function set_updated_at_fn();

create trigger trg_work_items_set_updated_at
    before update on work_items
    for each row execute function set_updated_at_fn();

create trigger trg_sprint_presentations_set_updated_at
    before update on sprint_presentations
    for each row execute function set_updated_at_fn();

-- ============================================================
-- 2) work_items.team_member_id, work_items.team_id ile AYNI takima ait
--    olmak ZORUNDA ama bunu dogrulayan hicbir sey yok - bir is kalemi baska
--    bir takimin uyesine atanabilir, ne FK ne CHECK bunu yakalar (V8'deki
--    status_code dogrulamasiyla AYNI sinif sorun, orada cozulmus, burada
--    unutulmus). Yerel veride ihlal YOK (dogrulandi), ama canli veritabanini
--    buradan goremedigim icin ADD CONSTRAINT yerine bir DO blogu ile
--    savunmaci davraniyorum: eger orada beklenmedik bir uyusmazlik varsa
--    deploy KIRILMAZ, sadece NOTICE ile bildirilir ve tetikleyici
--    kurulmadan gecilir - bu durumda veri once elle temizlenmeli.
-- ============================================================
create function trg_work_items_member_team_match_fn()
returns trigger
language plpgsql
as $$
declare
    v_member_team_id bigint;
begin
    if new.team_member_id is null then
        return new;
    end if;
    select team_id into v_member_team_id from team_members where id = new.team_member_id;
    if v_member_team_id is not null and v_member_team_id <> new.team_id then
        raise exception 'work_items.team_member_id=% takim %, ama work_items.team_id=% - is kalemi kendi uyesinin takimina ait olmayan bir takima atanamaz.',
            new.team_member_id, v_member_team_id, new.team_id;
    end if;
    return new;
end;
$$;

do $$
begin
    if exists (
        select 1 from work_items wi
        join team_members tm on tm.id = wi.team_member_id
        where wi.team_id <> tm.team_id
    ) then
        raise notice 'work_items icinde team_id/team_member_id uyusmayan kayitlar var - trg_work_items_member_team_match kurulmadi, once veriyi duzeltin.';
    else
        create trigger trg_work_items_member_team_match
            before insert or update of team_id, team_member_id on work_items
            for each row execute function trg_work_items_member_team_match_fn();
    end if;
end $$;

-- ============================================================
-- 3) work_items.source serbest metin (varchar(20)) - status_code'un aksine
--    (fn_status_code_valid ile korunuyor) hicbir dogrulamasi yok, yanlis
--    yazilmis bir deger (orn. "Jira" yerine "JIRA") sessizce gecer ve
--    WorkItemSource.valueOf() Java tarafinda ClassCastException/enum hatasi
--    olarak GERI DONUSTE patlar - kaynagi veritabani olan bir hata.
-- ============================================================
do $$
begin
    if exists (select 1 from work_items where source not in ('MANUAL', 'JIRA')) then
        raise notice 'work_items.source icinde MANUAL/JIRA disinda deger var - chk_work_items_source_valid eklenmedi, once veriyi duzeltin.';
    else
        alter table work_items
            add constraint chk_work_items_source_valid check (source in ('MANUAL', 'JIRA'));
    end if;
end $$;

-- ============================================================
-- 4) team_member_custom_field_values, o takimda GERCEKTEN tanimli olmayan
--    bir field_key ile satir alabiliyor - dogrudan bir FK bunu ifade edemez
--    (hedef anahtar team_custom_field_definitions(team_id, field_key), ama
--    bu tablonun kendisinde team_id yok, sadece team_member_id var; team_id'ye
--    team_members uzerinden dolayli ulasiliyor). V13, bir tanim SILINDIGINDE
--    oksuz kalan degerleri temizliyordu (trg_cleanup_orphaned_custom_field_values)
--    ama hicbir zaman VAR OLMAMIS bir field_key'in ustten yazilmasini engellemiyordu.
-- ============================================================
create function trg_custom_field_value_definition_exists_fn()
returns trigger
language plpgsql
as $$
declare
    v_team_id bigint;
begin
    select team_id into v_team_id from team_members where id = new.team_member_id;
    if v_team_id is null then
        raise exception 'team_member_custom_field_values.team_member_id=% gecerli bir team_members kaydina isaret etmiyor.', new.team_member_id;
    end if;
    if not exists (
        select 1 from team_custom_field_definitions
        where team_id = v_team_id and field_key = new.field_key
    ) then
        raise exception 'team_member_custom_field_values.field_key=% takim id=% icin tanimli bir ozel alan degil.', new.field_key, v_team_id;
    end if;
    return new;
end;
$$;

do $$
begin
    if exists (
        select 1 from team_member_custom_field_values v
        join team_members tm on tm.id = v.team_member_id
        left join team_custom_field_definitions d on d.team_id = tm.team_id and d.field_key = v.field_key
        where d.id is null
    ) then
        raise notice 'team_member_custom_field_values icinde tanimsiz field_key kullanan kayitlar var - trg_custom_field_value_definition_exists kurulmadi, once veriyi duzeltin.';
    else
        create trigger trg_custom_field_value_definition_exists
            before insert or update on team_member_custom_field_values
            for each row execute function trg_custom_field_value_definition_exists_fn();
    end if;
end $$;

-- ============================================================
-- 5) sprint_presentation_versions "insert-only" olarak TASARLANMIS (bkz.
--    PresentationService.rollback/upsert yorumlari - versiyon gecmisi ve
--    rollback ozelligi bunun UZERINE kurulu) ama audit_log'un aksine
--    (trg_audit_log_immutable, V11) bunu DB seviyesinde zorlayan hicbir sey
--    yok. Dogrudan bir UPDATE/DELETE sessizce basarili olur ve surum
--    gecmisini/rollback garantisini kirar.
-- ============================================================
create function trg_presentation_versions_immutable_fn()
returns trigger
language plpgsql
as $$
begin
    raise exception 'sprint_presentation_versions kayitlari degistirilemez veya silinemez (insert-only) - bkz. PresentationService.rollback.';
end;
$$;

create trigger trg_presentation_versions_immutable
    before update or delete on sprint_presentation_versions
    for each row execute function trg_presentation_versions_immutable_fn();

-- ============================================================
-- 6) leave_periods'ta AYNI kisi icin (team_member_id) tarih araliklari
--    CAKISABILIYOR - hicbir kisit engellemiyor. LeaveService.calculateApprovedLeaveDays
--    bu satirlarin TUMUNU is gunu hesabina dahil ediyor, yani iki cakisan
--    izin kaydi (orn. kullanici arayuzunde bir kez daha "Izin Ekle" ile
--    yanlislikla ayni araligin tekrar girilmesi) izin gununu IKI KERE sayar
--    ve kapasite dashboard'unda kisinin kalan kapasitesini oldugundan az
--    gosterir - sessiz, tespit edilmesi zor bir hesap hatasi.
--
--    btree_gist, "=" (team_member_id) ile "&&" (daterange) operatorlerini
--    AYNI EXCLUDE kisitinda birlikte kullanabilmek icin gerekli - Postgres'in
--    coreu sadece gist native tiplerini destekler, btree_gist bunu skaler
--    esitlige de genisletir. Sadece COMPANY_WIDE olmayan (team_member_id
--    dolu) satirlar icin uygulanir; sirket geneli tatiller (team_member_id
--    NULL) NULL <> NULL oldugu icin zaten birbirini kisitlamaz.
-- ============================================================
create extension if not exists btree_gist;

do $$
begin
    alter table leave_periods
        add constraint excl_leave_periods_no_overlap
        exclude using gist (
            team_member_id with =,
            daterange(start_date, end_date, '[]') with &&
        )
        where (team_member_id is not null);
exception when exclusion_violation then
    raise notice 'leave_periods icinde ayni kisi icin cakisan tarih araliklari var - excl_leave_periods_no_overlap eklenmedi, once veriyi duzeltin.';
end $$;

-- ============================================================
-- 7) status_options: ayni takimda (veya genel kumede) iki farkli kod AYNI
--    label'i tasiyabiliyor (orn. iki "Kapalı" kodu) - teknik olarak bir
--    seyi bozmaz ama dashboard/dropdown'da kullaniciya BIREBIR AYNI gorunen
--    iki secenek sunar, hangisinin secildigi anlasilmaz hale gelir.
--    uq_status_options_team_code ile AYNI (team_id, X) deseni - team_id NULL
--    oldugunda Postgres NULL'lari birbirinden farkli sayar, yani "genel"
--    kayitlar arasinda da (koddaki gibi) ayni davranis korunur.
-- ============================================================
do $$
begin
    if exists (
        select 1 from status_options group by team_id, label having count(*) > 1
    ) then
        raise notice 'status_options icinde ayni takimda/genelde tekrarlanan label var - uq_status_options_team_label eklenmedi, once veriyi duzeltin.';
    else
        alter table status_options
            add constraint uq_status_options_team_label unique (team_id, label);
    end if;
end $$;

-- ============================================================
-- 8) Raporlama/hiz view'lari - CapacityCalculationService'in dashboard'da
--    HER yuklemede is kalemlerini JVM'e cekip bellekte kisi bazli
--    planli/tamamlanan/acik efor toplayan dongusunun (calculateMemberMetrics)
--    DB tarafindaki hazir karsiligi. V13'teki team_member_open_workload
--    SADECE acik is kalemi sayisini/eforunu veriyordu, dashboard'un asil
--    ihtiyaci olan "toplam" ve "tamamlanan" eforu iceremiyordu - burada
--    ayni view genisletiliyor (CREATE OR REPLACE, kolon EKLENIYOR, hicbiri
--    kaldirilmiyor - geriye donuk uyumlu).
--
--    NOT: Bu view'lar su an HICBIR Java kodu tarafindan OKUNMUYOR - mevcut
--    CapacityDashboardService/CapacityCalculationService akisina BAGLANMADI.
--    Bunu yapmak (canli, dogru calisan bir hesaplamayi SQL'e tasimak) ayri
--    bir karar olmali - burada sadece view'lar hazirlaniyor, ileride bir
--    "genel bakis" ekrani veya raporlama ihtiyacinda tek sorguyla
--    kullanilabilsin diye.
-- ============================================================
create or replace view team_member_open_workload as
select
    tm.id as team_member_id,
    tm.team_id,
    tm.full_name,
    tm.role,
    count(wi.id) as open_work_item_count,
    coalesce(sum(wi.planned_effort_days), 0) as open_planned_effort_days
from team_members tm
left join work_items wi
    on wi.team_member_id = tm.id
    and not exists (
        select 1 from status_options so
        where so.code = wi.status_code
          and (so.team_id = tm.team_id or so.team_id is null)
          and so.counts_as_completed
    )
group by tm.id, tm.team_id, tm.full_name, tm.role;

create view team_member_effort_summary as
select
    tm.id as team_member_id,
    tm.team_id,
    tm.full_name,
    tm.role,
    count(wi.id) as total_work_item_count,
    coalesce(sum(wi.planned_effort_days), 0) as total_planned_effort_days,
    coalesce(sum(wi.planned_effort_days) filter (
        where exists (
            select 1 from status_options so
            where so.code = wi.status_code
              and (so.team_id = tm.team_id or so.team_id is null)
              and so.counts_as_completed
        )
    ), 0) as completed_effort_days,
    coalesce(sum(wi.planned_effort_days) filter (
        where not exists (
            select 1 from status_options so
            where so.code = wi.status_code
              and (so.team_id = tm.team_id or so.team_id is null)
              and so.counts_as_completed
        )
    ), 0) as remaining_effort_days
from team_members tm
left join work_items wi on wi.team_member_id = tm.id
group by tm.id, tm.team_id, tm.full_name, tm.role;

create view team_work_item_effort_summary as
select
    t.id as team_id,
    t.name as team_name,
    count(wi.id) as total_work_item_count,
    coalesce(sum(wi.planned_effort_days), 0) as total_planned_effort_days,
    coalesce(sum(wi.planned_effort_days) filter (
        where exists (
            select 1 from status_options so
            where so.code = wi.status_code
              and (so.team_id = t.id or so.team_id is null)
              and so.counts_as_completed
        )
    ), 0) as completed_effort_days,
    coalesce(sum(wi.planned_effort_days) filter (
        where not exists (
            select 1 from status_options so
            where so.code = wi.status_code
              and (so.team_id = t.id or so.team_id is null)
              and so.counts_as_completed
        )
    ), 0) as remaining_effort_days
from teams t
left join work_items wi on wi.team_id = t.id
group by t.id, t.name;
