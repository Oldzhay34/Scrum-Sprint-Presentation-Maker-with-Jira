-- Kapak sayfasindaki "Sprint no"/"Tarih araligi" ile Jira'daki gercek aktif
-- sprint numarasi/tarih araligi arasindaki sapmayi gidermek icin (bkz.
-- JiraSyncRequestConsumer.extractActiveSprint, kullanici bildirimi 2026-08-18:
-- "sprint 7 yazıyor" ama gercekte sprint 13'te) sprint'in kendi baslangic/bitis
-- tarihleri de work_items'a senkronize edilir - boylece frontend "Yenile" ile
-- bu alanlari otomatik doldurabilir.
alter table work_items add column sprint_start_date date;
alter table work_items add column sprint_end_date date;
