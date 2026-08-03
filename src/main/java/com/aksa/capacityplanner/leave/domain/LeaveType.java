package com.aksa.capacityplanner.leave.domain;

public enum LeaveType {
    /** Resmi tatil (yilbasi, bayram vb.), tum sirket icin gecerli. */
    RESMI_TATIL,
    /** Sirkete/holdinge ozgu birlestirilmis toplu izin gunu. */
    SIRKET_TATILI,
    /** Kisiye ozel yillik izin. */
    YILLIK_IZIN
}
