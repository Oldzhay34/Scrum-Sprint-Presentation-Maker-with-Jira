-- Bu migration iki gercek (halihazirda ulasilabilir) veri anomalisi riskini
-- DB seviyesinde kapatir ve raporlama/hizli-okuma icin iki view ekler.
-- Semanin geri kalani zaten normalize (bkz. V7, V8, V9, V11 - 1NF/3NF
-- duzeltmeleri ve referans butunlugu daha once yapilmis), bu yuzden burada
-- sadece yeni tespit edilen somut eksikler ele alinir.

-- ============================================================
-- 1) team_custom_field_definitions silindiginde, ona ait
--    team_member_custom_field_values satirlari OKSUZ (orphan) kaliyor.
--
--    Neden gercek bir risk: TeamService.removeCustomField() ->
--    DELETE FROM team_custom_field_definitions WHERE id=... zaten canli bir
--    endpoint uzerinden tetiklenebiliyor (DELETE /api/teams/{teamId}/custom-fields/{fieldId}),
--    ama team_member_custom_field_values tablosunda field_key'e giden bir FK
--    YOK (olamaz da - value tablosu team_member_id+field_key ile anahtarli,
--    field_key'in tekilligi team_custom_field_definitions'ta team_id+field_key
--    ile saglaniyor, dogrudan bir FK iki farkli tabloyu team_id uzerinden
--    dolayli baglamak zorunda). Sonuc: bir alan silinip AYNI field_key ile
--    yeniden eklenirse, eski (silinmesi gereken) degerler sessizce yeniden
--    ortaya cikar - veri sizintisi/anomalisi.
-- ============================================================
create function trg_cleanup_orphaned_custom_field_values_fn()
returns trigger
language plpgsql
as $$
begin
    delete from team_member_custom_field_values v
    using team_members m
    where v.team_member_id = m.id
      and m.team_id = old.team_id
      and v.field_key = old.field_key;
    return old;
end;
$$;

create trigger trg_cleanup_orphaned_custom_field_values
    after delete on team_custom_field_definitions
    for each row
    execute function trg_cleanup_orphaned_custom_field_values_fn();

-- ============================================================
-- 2) status_options silinirken, o kod hala team_members.status_code veya
--    work_items.status_code tarafindan kullaniliyor olabilir.
--
--    V8'deki fn_status_code_valid + CHECK constraint, sadece team_members/
--    work_items satiri INSERT/UPDATE edilirken calisir - status_options
--    TARAFINDAN silinen bir kodu, onu KULLANAN satirlar hic degismeden
--    oksuz birakabilir (Postgres CHECK, baska bir tablodaki DELETE'i tetiklemez).
--    Bugun StatusOptionRepositoryPort.deleteById() hicbir controller'dan
--    cagrilmiyor (dead code) ama arayuzde zaten hazir - ileride bir DELETE
--    endpoint'i eklenirse bu koruma olmadan sessizce referans butunlugu
--    bozulur. FK yerine trigger kullanilma nedeni V8 ile ayni: bir kod hem
--    GENEL (team_id IS NULL) hem TAKIMA OZGU olabildigi icin duz bir FK bu
--    OR mantigini ifade edemez.
-- ============================================================
create function trg_status_options_prevent_delete_if_in_use_fn()
returns trigger
language plpgsql
as $$
begin
    if exists (
        select 1 from team_members m
        where m.status_code = old.code and (old.team_id is null or m.team_id = old.team_id)
    ) or exists (
        select 1 from work_items w
        where w.status_code = old.code and (old.team_id is null or w.team_id = old.team_id)
    ) then
        raise exception 'status_options.code=% kullanimda oldugu icin silinemez (once bu kodu kullanan kayitlari baska bir statuye tasiyin).', old.code;
    end if;
    return old;
end;
$$;

create trigger trg_status_options_prevent_delete_if_in_use
    before delete on status_options
    for each row
    execute function trg_status_options_prevent_delete_if_in_use_fn();

-- ============================================================
-- 3) Raporlama/okuma view'lari - CapacityCalculationService'in Java
--    tarafinda her dashboard yuklemesinde tum work_items satirlarini JVM'e
--    cekip bellekte filtreleyip topladigi "acik is yuku" hesabinin DB
--    tarafindaki hafif/salt-okunur karsiligi. Dashboard'un asil (bakim
--    orani, izin, hedef is gunu dahil tam) hesabi HALA CapacityCalculationService
--    icinde kalir - bu view onun yerine gecmez, sadece hizli/raporlama amacli
--    (orn. ileride bir "genel bakis" ekrani veya BI araci) tek sorguda
--    ozet cekmek icin.
-- ============================================================
create view team_member_open_workload as
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

-- work_items uzerinde status bazli filtreleme (yukaridaki view ve
-- CapacityCalculationService'in "tamamlanan/acik" ayrimi) icin - su ana kadar
-- team_id ve team_member_id ayri ayri indeksliydi (bkz. V1), ikisinin birlikte
-- kullanildigi (bir takimdaki acik isleri cekme) sorgular icin composite index yok.
create index idx_work_items_team_id_status_code on work_items(team_id, status_code);

-- sprint_presentations_readonly (V5) view'inin altindaki head tabloda
-- en sik erisim deseni "takima gore en son sunum" - team_id zaten index'li
-- (bkz. V4) ama sprint_no ile birlikte aranma sikligina gore composite'e
-- gerek olmadigi degerlendirildi (uq_sprint_presentations_team_sprint zaten
-- (team_id, sprint_no) uzerinde unique index olarak bu sorguyu karsiliyor).
