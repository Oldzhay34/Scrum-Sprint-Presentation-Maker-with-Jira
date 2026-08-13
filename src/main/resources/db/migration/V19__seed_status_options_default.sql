-- V14, status_options'i SADECE RPA (team_id=1) ve Is Zekasi (team_id=2) icin
-- doldurmustu. Digerlerinin (SD, YZ, DA, DSYS - team_id 3,4,5,6) HICBIR
-- status_options satiri yok. V8'deki fn_status_code_valid/chk_work_items_status_code
-- kontrolu "team_id = p_team_id OR team_id IS NULL" kuralini uyguluyor (bkz. o
-- migration'in yorumu - "genel + takima ozgu" tasarimi zaten buna gore
-- kurulmustu), ama hicbir GENEL (team_id IS NULL) satir da eklenmemisti.
--
-- Sonuc: JIRA_ENABLED=true yapilip SD/YZ/DA/DSYS icin senkronizasyon
-- tetiklenince, JiraStatusMapper'in urettigi HER statu kodu (Backlog dahil -
-- fallback bile olsa) bu 4 takim icin CHECK ihlaline dusuyor, yani cekilen
-- TUM issue'lar sessizce basarisiz sayiliyordu (JiraSyncRequestConsumer'daki
-- per-issue try/catch yuzunden hata gorunmez, sadece "N basarisiz" olarak
-- audit_log'a yaziliyordu). Board id'leri artik elimizde oldugu icin bu artik
-- gercek bir engel - RPA/IZ'nin kullandigi vokabuleri (V14) GENEL (team_id
-- NULL) olarak ekleyerek her takim icin calisir hale getiriyoruz. Takimlar
-- kendi ozel statu setlerini istedikleri zaman /api/teams/{id}/custom-fields
-- benzeri bir uc noktadan team_id'ye ozel satirlarla ustune yazabilir (team_id
-- ozel satir varsa fn_status_code_valid ikisini de gecerli sayar).
insert into status_options (team_id, code, label, counts_as_completed, sort_order) values
    (null, 'Backlog', 'Backlog', false, 1),
    (null, 'Beklemede', 'Beklemede', false, 2),
    (null, 'Analiz Havuzu', 'Analiz Havuzu', false, 3),
    (null, 'Analiz Onayı', 'Analiz Onayı', false, 4),
    (null, 'Ön Analiz', 'Ön Analiz', false, 5),
    (null, 'Analiz', 'Analiz', false, 6),
    (null, 'Geliştirme Havuzu', 'Geliştirme Havuzu', false, 7),
    (null, 'Geliştirme', 'Geliştirme', false, 8),
    (null, 'Müşteri Bekleniyor', 'Müşteri Bekleniyor', false, 9),
    (null, 'UAT', 'UAT', false, 10),
    (null, 'Devam Ediyor', 'Devam Ediyor', false, 11),
    (null, 'Canlı', 'Canlı', true, 12),
    (null, 'Canlıda/Y', 'Canlıda/Y', true, 13),
    (null, 'İptal', 'İptal', true, 14);
