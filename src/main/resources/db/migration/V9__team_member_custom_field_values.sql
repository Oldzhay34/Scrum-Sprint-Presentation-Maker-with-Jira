-- 1NF duzeltmesi: team_members.custom_field_values, takima ozgu dinamik
-- alanlari (bkz. team_custom_field_definitions) tek bir JSON metin
-- kolonunda (EAV-as-JSON) topluyordu. Tablo bos oldugu icin veri tasima
-- gerekmeden dogrudan uygun bir EAV tablosuna bolunuyor - her (uye, alan)
-- cifti kendi satirinda, atomik "value" degeriyle.
create table team_member_custom_field_values (
    team_member_id bigint not null references team_members(id) on delete cascade,
    field_key varchar(100) not null,
    value text,
    primary key (team_member_id, field_key)
);

alter table team_members drop column custom_field_values;
