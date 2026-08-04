package com.aksa.capacityplanner.team.domain;

/**
 * Bilinen takim tipleri (orn. RPA, Is Zekasi). Login akisi tamamlaninca
 * kullanicinin takimi buradan gelecek; admin tum takimlara erisebilecek.
 * fteTrackingEnabled, RPA gibi FTE (Full Time Equivalent) takibi yapan
 * takimlari, bu kavrami olmayan takimlardan (orn. Is Zekasi) ayirt eder.
 */
public enum TeamType {
    RPA(true),
    IS_ZEKASI(false),
    GENEL(false);

    private final boolean fteTrackingEnabled;

    TeamType(boolean fteTrackingEnabled) {
        this.fteTrackingEnabled = fteTrackingEnabled;
    }

    public boolean isFteTrackingEnabled() {
        return fteTrackingEnabled;
    }
}
