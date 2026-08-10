package com.aksa.capacityplanner.team.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "team_members")
@Getter
@Setter
@NoArgsConstructor
public class TeamMemberJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String role;

    private String email;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "status_code")
    private String statusCode;

    @Column(name = "target_work_days", precision = 6, scale = 2)
    private BigDecimal targetWorkDays;

    @Column(name = "target_work_days_overridden")
    private boolean targetWorkDaysOverridden;

    // 1NF: ayri bir EAV tablosunda (bkz. V9 migration) - Hibernate
    // @ElementCollection ile Map<fieldKey, value>'yu kendisi yonetir, entity/
    // adapter kodu JSON (de)serilestirme yapmaz.
    @ElementCollection
    @CollectionTable(name = "team_member_custom_field_values", joinColumns = @JoinColumn(name = "team_member_id"))
    @MapKeyColumn(name = "field_key")
    @Column(name = "value", columnDefinition = "text")
    private Map<String, String> customFieldValues = new HashMap<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
