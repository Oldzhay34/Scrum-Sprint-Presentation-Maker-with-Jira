-- Icerik Slayti artik tek tek Gorev/Story'leri degil, onlarin UST OGESINI
-- (Epic / "parent") gosterir - bkz. PO notu 2026-08-19: "Veriler Epicten
-- cekilecek ... Alan kimligi = Parent" + "Gorev/story alanlarindaki ust oge
-- bilgisi alinacak. Ayni kayit birden fazla olabilir sadece 1 tane gelmeli."
-- Bunun icin her is kaleminin bagli oldugu ust ogenin anahtari ve BASLIGI
-- work_items'a senkronize edilir (Jira'nin arama yaniti "parent" alanini
-- zaten fields.summary ile birlikte dondurur - ek istek gerekmez).
alter table work_items add column parent_key varchar(50);
alter table work_items add column parent_title varchar(500);

-- Jira issue tipi (Gorev/Story/Alt Gorev/Epic...) - Icerik Slayti SADECE
-- Gorev/Story seviyesindeki kayitlarin ust ogesini alir (alt gorevlerin
-- "parent"i Epic degil kendi hikayesidir, alinirsa liste yine sisirdi).
alter table work_items add column issue_type varchar(100);

-- active_sprint'in (V23) ikizi: is kalemi Jira'da EN SON KAPANAN sprintte mi?
-- "Tamamlanan Isler = bir onceki sprintin verileri" kurali icin gerekli
-- (bkz. PO notu 2026-08-19). Aktif sprint tespitinden farkli olarak bu,
-- takimin TUM issue'larindaki sprint kayitlari taranarak (en yeni endDate'li
-- closed sprint) bulunur.
alter table work_items add column previous_sprint boolean not null default false;

create index if not exists idx_work_items_team_parent on work_items (team_id, parent_key);
