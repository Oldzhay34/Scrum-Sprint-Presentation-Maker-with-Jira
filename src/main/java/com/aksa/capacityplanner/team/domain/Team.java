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
    /** Jira proje anahtari (orn. "RPA"), jira-sync tetiklenirken varsayilan olarak kullanilir. */
    private String jiraProjectKey;
    /** Jira board id'si (orn. RPA=538) - su an yalnizca referans/kesif amacli, senkronizasyon JQL'i etkilemez. */
    private Long jiraBoardId;
    /**
     * true ise Jira sync roster'da karsiligi olmayan assignee'ler icin ARTIK
     * YENI TeamMember otomatik olusturmaz (bkz. JiraSyncProcessor) -
     * eslesmeyen is kalemleri "atanmamis" kalir. Roster'i tamamen elle
     * (PO/admin) yonetilen takimlar icin (orn. RPA - bkz. V21 migration).
     */
    private boolean rosterLocked;
}
