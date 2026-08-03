package com.aksa.capacityplanner.leave.domain;

public enum LeaveScope {
    /** Tum sirket/holding icin gecerli (resmi tatil, sirket tatili). */
    COMPANY_WIDE,
    /** Sadece belirli bir ekip uyesine ait (yillik izin). */
    TEAM_MEMBER
}
