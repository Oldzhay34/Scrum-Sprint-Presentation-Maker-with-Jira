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

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
