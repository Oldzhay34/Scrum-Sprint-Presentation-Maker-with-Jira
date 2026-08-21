-- Jira sync, roster'da karsiligi olmayan HER assignee icin otomatik yeni
-- TeamMember olusturuyordu (bkz. JiraSyncRequestConsumer.provisionTeamMember).
-- Bir "en az N is kalemi" esigi (MIN_ITEMS_FOR_AUTO_PROVISION) denendi, ama
-- yetersiz kaldi: RPA'da bazi kisiler (Edip Yemen: 50, Aysegul Ay: 80 is
-- kalemi) esigi rahatca gecmesine ragmen gercek takim uyesi degil - item
-- sayisi bu takim icin guvenilir bir sinyal degil (bkz. kullanici bildirimi,
-- 2026-08-17). Bu yuzden roster tamamen KILITLENIYOR: roster_locked=true olan
-- takimlarda Jira sync ARTIK HICBIR YENI TeamMember otomatik olusturmaz -
-- eslesmeyen assignee'lerin is kalemleri "atanmamis" (team_member_id=null)
-- kalir, takim toplamina girer ama kisi bazli satirlarda gorunmez. Yeni bir
-- kisi gercekten takima katilirsa PO/admin POST /api/teams/{teamId}/members
-- ile elle ekler.
alter table teams add column roster_locked boolean not null default false;

update teams set roster_locked = true where id = 1; -- RPA Ekibi
