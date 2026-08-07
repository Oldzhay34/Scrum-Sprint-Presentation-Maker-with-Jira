package com.aksa.capacityplanner.leave.config;

import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.domain.LeaveType;
import com.aksa.capacityplanner.leave.port.out.LeavePeriodRepositoryPort;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;

/**
 * 2026 toplu izin/tatil takvimini (Aksa "2026 Toplu Yillik Izin Takvimi" duyurusu)
 * baslangic verisi olarak yukler. Tum kayitlar sonradan API uzerinden
 * degistirilebilir/silinebilir - burasi sadece varsayilan/ornek veridir.
 * Dini bayram tarihleri (Ramazan/Kurban) yaklasik resmi tarihlerdir, kesinlestiginde
 * güncellenmelidir.
 */
@Component
public class LeaveCalendarSeeder implements CommandLineRunner {

    private final LeavePeriodRepositoryPort repository;

    public LeaveCalendarSeeder(LeavePeriodRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (!repository.findByScope(LeaveScope.COMPANY_WIDE).isEmpty()) {
            return;
        }

        // Sabit resmi tatiller
        add("Yilbasi", LeaveType.RESMI_TATIL, d(2026, 1, 1), d(2026, 1, 1), 1);
        add("Ulusal Egemenlik ve Cocuk Bayrami", LeaveType.RESMI_TATIL, d(2026, 4, 23), d(2026, 4, 23), 1);
        add("Emek ve Dayanisma Gunu", LeaveType.RESMI_TATIL, d(2026, 5, 1), d(2026, 5, 1), 1);
        add("Ataturk'u Anma, Genclik ve Spor Bayrami", LeaveType.RESMI_TATIL, d(2026, 5, 19), d(2026, 5, 19), 1);
        add("Zafer Bayrami", LeaveType.RESMI_TATIL, d(2026, 8, 30), d(2026, 8, 30), 1);
        add("Cumhuriyet Bayrami", LeaveType.RESMI_TATIL, d(2026, 10, 29), d(2026, 10, 29), 1);

        // Dini bayramlar (yaklasik - kesinlesince guncellenmeli)
        add("Ramazan Bayrami", LeaveType.RESMI_TATIL, d(2026, 3, 20), d(2026, 3, 22), 1);
        add("Kurban Bayrami", LeaveType.RESMI_TATIL, d(2026, 5, 27), d(2026, 5, 30), 1);

        // Aksa 2026 birlestirilmis izin takvimi (duyurudaki kartlar)
        add("Ramazan Bayrami Arifesi", LeaveType.RESMI_TATIL, d(2026, 3, 19), d(2026, 3, 19), 0.5);
        add("Ulusal Egemenlik ve Cocuk Bayrami sonrasi kopru gunu", LeaveType.SIRKET_TATILI,
                d(2026, 4, 24), d(2026, 4, 24), 1);
        add("Ataturk'u Anma, Genclik ve Spor Bayrami oncesi kopru gunu", LeaveType.SIRKET_TATILI,
                d(2026, 5, 18), d(2026, 5, 18), 1);
        add("Kurban Bayrami Arifesi - kopru gunu", LeaveType.SIRKET_TATILI, d(2026, 5, 25), d(2026, 5, 25), 1);
        add("Kurban Bayrami Arifesi", LeaveType.RESMI_TATIL, d(2026, 5, 26), d(2026, 5, 26), 0.5);
        add("Ortak Sirket Izni", LeaveType.SIRKET_TATILI, d(2026, 8, 17), d(2026, 8, 22), 1);
        add("Cumhuriyet Bayrami Arifesi", LeaveType.RESMI_TATIL, d(2026, 10, 28), d(2026, 10, 28), 0.5);
        add("Cumhuriyet Bayrami sonrasi kopru gunu", LeaveType.SIRKET_TATILI, d(2026, 10, 30), d(2026, 10, 30), 1);
    }

    private void add(String name, LeaveType type, LocalDate start, LocalDate end, double fraction) {
        LeavePeriod period = new LeavePeriod(null, name, type, LeaveScope.COMPANY_WIDE, null,
                start, end, BigDecimal.valueOf(fraction), null);
        repository.save(period);
    }

    private LocalDate d(int year, int month, int day) {
        return LocalDate.of(year, Month.of(month), day);
    }
}
