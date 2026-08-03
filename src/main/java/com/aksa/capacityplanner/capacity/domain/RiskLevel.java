package com.aksa.capacityplanner.capacity.domain;

/**
 * RPA_Kapasite_Takip Excel'indeki "Durum" formulune birebir karsilik gelir:
 * IF(doluluk>=1.2,"Yuksek Risk", IF(doluluk>=1.0,"Risk", IF(doluluk>=0.85,"Dikkat","Uygun")))
 */
public enum RiskLevel {
    UYGUN,
    DIKKAT,
    RISK,
    YUKSEK_RISK
}
