package com.aksa.capacityplanner.team.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Statu alani sabit bir enum degil; her takim kendi statu listesini
 * yonetebilsin diye calisan kayittir (ornegin: Canli, Kapandi, Y, Iptal).
 * teamId null ise tum takimlarda kullanilabilen genel bir statudur.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusOption {

    private Long id;
    private Long teamId;
    private String code;
    private String label;
    /** Bu statudeki isler "tamamlanan/dusen efor" olarak mi sayilsin. */
    private boolean countsAsCompleted;
    private String colorHex;
    private int sortOrder;
}
