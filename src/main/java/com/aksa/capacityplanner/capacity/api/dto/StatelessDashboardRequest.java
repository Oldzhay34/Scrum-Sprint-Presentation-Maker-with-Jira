package com.aksa.capacityplanner.capacity.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * "Ilk surum" senaryosu: hicbir sey veritabanina kaydedilmeden, istekte gelen
 * verilerle anlik (I/O) kapasite dashboard'u hesaplanip donulur. Ekip/uye/is kalemi/statu
 * bilgileri sadece bu istek suresince yasar - kalici hale getirilmez.
 *
 * Resmi tatil takvimi (leave_periods, sirket genelinde seed edilmis referans veri) yine de
 * DB'den okunur; bu, kullanicinin girdigi/kaydetmek istemedigi veri degil, sabit sirket
 * takvimidir - mevcut veritabani yapisini bozmadan kullanilmaya devam eder.
 */
public record StatelessDashboardRequest(
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd,
        @NotNull LocalDate reportDate,
        LocalDate previousSnapshotDate,
        @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal maintenanceAllocationPercent,
        @NotEmpty List<@Valid MemberInput> members,
        List<@Valid WorkItemInput> workItems,
        List<@Valid StatusInput> statuses,
        Map<Long, BigDecimal> personalLeaveDaysByMemberId) {

    /**
     * clientId: bu istek icinde uyeyi is kalemlerinden referans vermek icin kullanilan gecici id (DB id'si degil).
     * maintenanceAllocationPercent: kisiye ozel bakim/SR orani - bos birakilirsa takim seviyesindeki
     * genel oran (ust seviye maintenanceAllocationPercent) kullanilir.
     */
    public record MemberInput(@NotNull Long clientId, @NotBlank String fullName, String role,
                               LocalDate startDate, String statusCode,
                               @PositiveOrZero BigDecimal targetWorkDays,
                               @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal maintenanceAllocationPercent) {
    }

    public record WorkItemInput(@NotNull Long memberClientId, @NotBlank String title,
                                 @NotNull @PositiveOrZero BigDecimal plannedEffortDays, String statusCode,
                                 LocalDate addedDate, LocalDate closedDate) {
    }

    public record StatusInput(@NotBlank String code, @NotBlank String label, boolean countsAsCompleted) {
    }
}
