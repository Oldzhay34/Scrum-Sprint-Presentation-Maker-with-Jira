package com.aksa.capacityplanner.capacity.api.dto;

import com.aksa.capacityplanner.capacity.domain.WorkItemSource;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Icerik Slayti'nin "Jira'dan Getir" akisi bu DTO'yu okur (bkz.
 * useJiraContentSuggestions.js / jiraContentMapper.js) - parentKey/parentTitle
 * ve previousSprint alanlari, slaytta tek tek Gorev/Story yerine bunlarin
 * TEKILLESTIRILMIS ust ogesinin (Epic) gosterilmesi icin eklendi
 * (PO notu 2026-08-19: "Veriler Epicten cekilecek ... Alan kimligi = Parent").
 */
public record WorkItemDto(Long id, Long teamId, Long teamMemberId, String title, String jiraIssueKey,
                           BigDecimal plannedEffortDays, String statusCode, WorkItemSource source,
                           LocalDate addedDate, LocalDate closedDate,
                           boolean flagged, String sector, String priority,
                           String sprintName, boolean activeSprint,
                           boolean previousSprint, String issueType,
                           String parentKey, String parentTitle, String parentLabels) {
}
