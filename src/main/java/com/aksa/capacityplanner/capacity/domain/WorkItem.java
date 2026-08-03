package com.aksa.capacityplanner.capacity.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Kapasite dashboard'unun ham veri birimi (Jira issue analogu).
 * source=MANUAL iken kullanici tarafindan elle girilir; source=JIRA iken
 * ileride JiraGatewayPort uzerinden senkronize edilecek (su an stub).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkItem {

    private Long id;
    private Long teamId;
    /** null ise henuz kisiye atanmamis. */
    private Long teamMemberId;
    private String title;
    /** Jira'dan geldiyse issue key (orn. PROJ-123), manuel girilirse null. */
    private String jiraIssueKey;
    private BigDecimal plannedEffortDays;
    /** team.domain.StatusOption.code degerine referans. */
    private String statusCode;
    private WorkItemSource source;
    private LocalDate addedDate;
    private LocalDate closedDate;
}
