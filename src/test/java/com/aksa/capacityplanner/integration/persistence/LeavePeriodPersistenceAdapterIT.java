package com.aksa.capacityplanner.integration.persistence;

import com.aksa.capacityplanner.leave.adapter.out.persistence.LeavePeriodPersistenceAdapter;
import com.aksa.capacityplanner.leave.domain.LeavePeriod;
import com.aksa.capacityplanner.leave.domain.LeaveScope;
import com.aksa.capacityplanner.leave.domain.LeaveType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test-h2")
@Import(LeavePeriodPersistenceAdapter.class)
class LeavePeriodPersistenceAdapterIT {

    @Autowired
    private LeavePeriodPersistenceAdapter adapter;

    @Test
    void save_roundTripsEnumsAndDayFraction() {
        LeavePeriod period = new LeavePeriod(null, "Kurban Bayrami Arifesi", LeaveType.RESMI_TATIL,
                LeaveScope.COMPANY_WIDE, null, LocalDate.of(2026, 5, 26), LocalDate.of(2026, 5, 26),
                new BigDecimal("0.50"), null);

        LeavePeriod saved = adapter.save(period);
        var found = adapter.findById(saved.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getType()).isEqualTo(LeaveType.RESMI_TATIL);
        assertThat(found.get().getScope()).isEqualTo(LeaveScope.COMPANY_WIDE);
        assertThat(found.get().getDayFraction()).isEqualByComparingTo("0.50");
    }

    @Test
    void findCompanyWideBetween_onlyReturnsOverlappingCompanyWidePeriods() {
        adapter.save(companyWide("Ortak Sirket Izni", LocalDate.of(2026, 8, 17), LocalDate.of(2026, 8, 22)));
        adapter.save(companyWide("Yilbasi", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 1)));
        adapter.save(new LeavePeriod(null, "Kisisel izin", LeaveType.YILLIK_IZIN, LeaveScope.TEAM_MEMBER,
                42L, LocalDate.of(2026, 8, 18), LocalDate.of(2026, 8, 19), BigDecimal.ONE, null));

        var result = adapter.findCompanyWideBetween(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));

        assertThat(result).extracting(LeavePeriod::getName).containsExactly("Ortak Sirket Izni");
    }

    private LeavePeriod companyWide(String name, LocalDate start, LocalDate end) {
        return new LeavePeriod(null, name, LeaveType.SIRKET_TATILI, LeaveScope.COMPANY_WIDE, null,
                start, end, BigDecimal.ONE, null);
    }
}
