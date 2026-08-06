-- 3NF/referans butunlugu: work_items.status_code ve team_members.status_code
-- hicbir FK ile status_options'a baglanmiyordu. Duz bir composite FK
-- kullanilamaz, cunku status_options'ta bir kod hem GENEL (team_id IS NULL)
-- hem de TAKIMA OZGU olabilir (bkz. TeamMemberService.validateStatusCode -
-- "genel + takima ozgu" kontrolu) - bu OR mantigini tek bir FK ifade edemez.
-- Ayni kurali DB seviyesinde de uygulayan bir skaler fonksiyon + CHECK
-- constraint kullanilir (uygulama katmanindaki kuralin birebir aynisi).
create function dbo.fn_status_code_valid(@teamId bigint, @statusCode nvarchar(50))
returns bit
as
begin
    if @statusCode is null return 1;
    if exists (
        select 1 from status_options
        where code = @statusCode and (team_id = @teamId or team_id is null)
    )
        return 1;
    return 0;
end
go

alter table team_members
    add constraint chk_team_members_status_code check (dbo.fn_status_code_valid(team_id, status_code) = 1);

alter table work_items
    add constraint chk_work_items_status_code check (dbo.fn_status_code_valid(team_id, status_code) = 1);
