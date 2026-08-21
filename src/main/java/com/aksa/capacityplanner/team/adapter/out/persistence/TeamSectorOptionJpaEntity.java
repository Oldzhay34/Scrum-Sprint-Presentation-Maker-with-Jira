package com.aksa.capacityplanner.team.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_sector_options")
@Getter
@Setter
@NoArgsConstructor
public class TeamSectorOptionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "sector_value", nullable = false)
    private String sectorValue;

    public TeamSectorOptionJpaEntity(Long teamId, String sectorValue) {
        this.teamId = teamId;
        this.sectorValue = sectorValue;
    }
}
