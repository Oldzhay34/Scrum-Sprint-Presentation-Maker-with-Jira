package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/** Insert-only audit log satiri - hic guncellenmez/silinmez. */
@Entity
@Table(name = "sprint_presentation_versions")
@Getter
@Setter
@NoArgsConstructor
public class PresentationVersionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "presentation_id", nullable = false)
    private Long presentationId;

    @Column(nullable = false)
    private int version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private Map<String, Object> content = new HashMap<>();

    @Column(name = "updated_by", nullable = false)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "updated_at", updatable = false)
    private Instant updatedAt;
}
