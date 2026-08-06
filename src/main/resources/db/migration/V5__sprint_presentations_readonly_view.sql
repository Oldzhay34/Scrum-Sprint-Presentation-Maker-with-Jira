-- Salt-okunur erisim (baska takimin PO'su veya admin goruntulerken) icin
-- sprint_presentations head tablosunun uzerinden gecen bir view. Head tablo
-- zaten her zaman "son versiyon" icerigini tutar (bkz. V4), bu view sadece
-- okuma yolunu yazma yolundan (dogrudan tablo) ayirmak icin ayri bir isimle
-- aciga cikarilir.
create view sprint_presentations_readonly as
select id, team_id, sprint_no, date_range, content, current_version, updated_by, created_at, updated_at
from sprint_presentations;
