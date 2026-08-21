-- JiraSyncRequestConsumer.provisionTeamMember, TeamMemberService.addMember'i
-- (targetWorkDays null ise TargetWorkDaysCalculator ile varsayilan atar) BYPASS
-- ediyordu - Jira'dan otomatik olusturulan takim uyelerinde target_work_days
-- HEP null kaliyordu, bu da Kullanilabilir Kapasite'yi (Hedef - Gecen - Izin)
-- her zaman 0 gosteriyordu (bkz. kullanici bildirimi, 2026-08-18). Kod tarafi
-- duzeltildi (artik yeni senkronizasyonlarda 145 atanir - startDate hep null
-- oldugu icin TargetWorkDaysCalculator.calculateDefault de hep 145 doner);
-- bu migration var olan null kayitlari AYNI kurala gore tek seferlik doldurur.
update team_members
set target_work_days = 145,
    target_work_days_overridden = false
where target_work_days is null;
