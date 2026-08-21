package com.aksa.capacityplanner.team.adapter.out.persistence;

import com.aksa.capacityplanner.team.domain.TeamType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
public class TeamJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "maintenance_allocation_percent", precision = 5, scale = 4)
    private BigDecimal maintenanceAllocationPercent;

    @Column(name = "default_target_work_days", precision = 6, scale = 2)
    private BigDecimal defaultTargetWorkDays;

    @Enumerated(EnumType.STRING)
    @Column(name = "team_type", nullable = false)
    private TeamType teamType;

    @Column(name = "jira_project_key")
    private String jiraProjectKey;

    @Column(name = "jira_board_id")
    private Long jiraBoardId;

    @Column(name = "roster_locked", nullable = false)
    private boolean rosterLocked;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
