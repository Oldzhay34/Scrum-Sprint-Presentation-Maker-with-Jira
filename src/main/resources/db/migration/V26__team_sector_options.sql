-- Icerik Slayti'nda "madde ekle" satirindaki "Sektor (ops.)" dropdown'u
-- SIMDIYE KADAR tum takimlar icin AYNI sabit listeyi (EPSAS, Dogalgaz, ...)
-- gosteriyordu - ama her takimin Jira'da baktigi sektorler farkli (bkz.
-- kullanici bildirimi, 2026-08-18: referans "Jira Dashboard" projesinin
-- boardConfig.js'i her takimin FARKLI sektor kumesine sahip oldugunu
-- dogruluyor). Bu tablo takim basina, o takimin Jira'daki is kalemlerinde
-- GERCEKTEN gorulen sektor degerlerinin (customfield_10498) listesini tutar -
-- her "Jira'dan Cek" senkronizasyonunda JiraSyncRequestConsumer tarafindan
-- yeniden hesaplanip TAMAMEN degistirilir (kullanici tarafindan elle
-- duzenlenmez).
create table team_sector_options (
    id bigserial primary key,
    team_id bigint not null references teams(id) on delete cascade,
    sector_value varchar(200) not null,
    unique (team_id, sector_value)
);
