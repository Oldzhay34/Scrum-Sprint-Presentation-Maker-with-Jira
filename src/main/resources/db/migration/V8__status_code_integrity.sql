-- 3NF/referans butunlugu: work_items.status_code ve team_members.status_code
-- hicbir FK ile status_options'a baglanmiyordu. Duz bir composite FK
-- kullanilamaz, cunku status_options'ta bir kod hem GENEL (team_id IS NULL)
-- hem de TAKIMA OZGU olabilir (bkz. TeamMemberService.validateStatusCode -
-- "genel + takima ozgu" kontrolu) - bu OR mantigini tek bir FK ifade edemez.
-- Ayni kurali DB seviyesinde de uygulayan bir fonksiyon + CHECK constraint
-- kullanilir (uygulama katmanindaki kuralin birebir aynisi).
create function fn_status_code_valid(p_team_id bigint, p_status_code varchar(50))
returns boolean
language plpgsql
as $$
begin
    if p_status_code is null then
        return true;
    end if;
    if exists (
        select 1 from status_options
        where code = p_status_code and (team_id = p_team_id or team_id is null)
    ) then
        return true;
    end if;
    return false;
end;
$$;

alter table team_members
    add constraint chk_team_members_status_code check (fn_status_code_valid(team_id, status_code));

alter table work_items
    add constraint chk_work_items_status_code check (fn_status_code_valid(team_id, status_code));
