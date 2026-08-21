package com.aksa.capacityplanner.capacity.adapter.out.persistence;

import com.aksa.capacityplanner.capacity.domain.WorkItemSource;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "work_items")
@Getter
@Setter
@NoArgsConstructor
public class WorkItemJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "team_member_id")
    private Long teamMemberId;

    @Column(nullable = false)
    private String title;

    @Column(name = "jira_issue_key")
    private String jiraIssueKey;

    @Column(name = "planned_effort_days", precision = 8, scale = 2)
    private BigDecimal plannedEffortDays;

    @Column(name = "status_code")
    private String statusCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkItemSource source;

    @Column(name = "added_date")
    private LocalDate addedDate;

    @Column(name = "closed_date")
    private LocalDate closedDate;

    @Column(nullable = false)
    private boolean flagged;

    private String sector;

    private String priority;

    @Column(name = "sprint_name")
    private String sprintName;

    @Column(name = "active_sprint", nullable = false)
    private boolean activeSprint;

    @Column(name = "sprint_start_date")
    private LocalDate sprintStartDate;

    @Column(name = "sprint_end_date")
    private LocalDate sprintEndDate;

    @Column(name = "previous_sprint", nullable = false)
    private boolean previousSprint;

    @Column(name = "issue_type")
    private String issueType;

    @Column(name = "parent_key")
    private String parentKey;

    @Column(name = "parent_title")
    private String parentTitle;

    @Column(name = "parent_labels")
    private String parentLabels;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
