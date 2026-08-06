-- 1NF duzeltmesi: team_members.custom_field_values, takima ozgu dinamik
-- alanlari (bkz. team_custom_field_definitions) tek bir JSON metin
-- kolonunda (EAV-as-JSON) topluyordu. Tablo bos oldugu icin veri tasima
-- gerekmeden dogrudan uygun bir EAV tablosuna bolunuyor - her (uye, alan)
-- cifti kendi satirinda, atomik "value" degeriyle.
create table team_member_custom_field_values (
    team_member_id bigint not null references team_members(id) on delete cascade,
    field_key nvarchar(100) not null,
    value nvarchar(max),
    primary key (team_member_id, field_key)
);

-- SQL Server, "default '{}'" icin adsiz bir DEFAULT constraint uretmisti
-- (V1__init.sql) - kolonu direkt DROP etmeden once bu constraint'i (adi
-- otomatik/rastgele oldugu icin dinamik olarak) once dusurmek gerekiyor.
declare @constraintName nvarchar(200);
select @constraintName = dc.name
from sys.default_constraints dc
join sys.columns c on c.default_object_id = dc.object_id
where dc.parent_object_id = object_id('team_members') and c.name = 'custom_field_values';
if @constraintName is not null
    exec('alter table team_members drop constraint ' + @constraintName);

alter table team_members drop column custom_field_values;
