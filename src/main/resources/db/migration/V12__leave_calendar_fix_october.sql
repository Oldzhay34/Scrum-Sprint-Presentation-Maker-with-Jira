-- LeaveCalendarSeeder ilk calistiginda "28-30 Ekim" kartindaki (Aksa 2026
-- Toplu Yillik Izin Takvimi) Cumhuriyet Bayrami SONRASI kopru gununu (30 Ekim)
-- eksik ekliyordu (sadece 28 Ekim/arife vardi) - seeder idempotent oldugu
-- icin (COMPANY_WIDE bos degilse hic calismiyor) zaten seed edilmis
-- veritabanlarinda bu satir hep eksik kalacakti. Burada dogrudan eklenir.
insert into leave_periods (name, type, scope, team_member_id, start_date, end_date, day_fraction, description)
select 'Cumhuriyet Bayrami sonrasi kopru gunu', 'SIRKET_TATILI', 'COMPANY_WIDE', null, '2026-10-30', '2026-10-30', 1.0, null
where not exists (
    select 1 from leave_periods where scope = 'COMPANY_WIDE' and start_date = '2026-10-30' and end_date = '2026-10-30'
);
