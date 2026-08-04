package com.aksa.capacityplanner.team.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Team {

    private Long id;
    private String name;
    private String description;
    /** Bakim/SR icin ayrilan kapasite orani, orn 0.20 = %20 */
    private BigDecimal maintenanceAllocationPercent;
    /** 1 Haziran - 31 Aralik donemi icin varsayilan hedef is gunu (default 145). */
    private BigDecimal defaultTargetWorkDays;
    /** Takimin tipi (orn. RPA, IS_ZEKASI) - FTE gibi takima ozgu ozelliklerin varligini belirler. */
    private TeamType teamType;
}
