package com.aksa.capacityplanner.presentation.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "presentation_download_logs")
@Getter
@Setter
@NoArgsConstructor
public class PresentationDownloadLogJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "download_type", nullable = false)
    private String downloadType;

    // 1NF: ayri bir junction tablosunda (bkz. V7 migration) - Hibernate bunu
    // @ElementCollection ile serbestce yonetir, entity/adapter kodu elle
    // string birlestirme/ayirma yapmaz.
    @ElementCollection
    @CollectionTable(name = "presentation_download_log_teams", joinColumns = @JoinColumn(name = "download_log_id"))
    @Column(name = "team_id", nullable = false)
    private Set<Long> teamIds = new HashSet<>();

    @Column(name = "downloaded_by", nullable = false)
    private String downloadedBy;

    @CreationTimestamp
    @Column(name = "downloaded_at", updatable = false)
    private Instant downloadedAt;
}
