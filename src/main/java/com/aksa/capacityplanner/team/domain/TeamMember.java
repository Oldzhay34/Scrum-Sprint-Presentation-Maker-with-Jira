package com.aksa.capacityplanner.team.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember {

    private Long id;
    private Long teamId;
    private String fullName;
    private String role;
    private String email;
    private LocalDate startDate;
    /** StatusOption.code degerine referans; sonradan degistirilebilir. */
    private String statusCode;
    /**
     * 1 Haziran - 31 Aralik donemi icin hedeflenen is gunu.
     * startDate 1 Haziran'dan onceyse varsayilan 145; sonraysa TargetWorkDaysCalculator ile
     * orantili hesaplanir. Kullanici her zaman override edebilir.
     */
    private BigDecimal targetWorkDays;
    private boolean targetWorkDaysOverridden;
    /** Takima ozgu ek alanlarin degerleri (fieldKey -> deger, string olarak saklanir). */
    private Map<String, String> customFieldValues = new HashMap<>();
    /** Jira'nin kalici kullanici kimligi (accountId) - displayName degisse bile ayni kisiyi gosterir. Manuel eklenen uyelerde null. */
    private String jiraAccountId;
    /** Jira profil fotografi URL'i (assignee.avatarUrls['48x48']) - yoksa frontend bas harflerle gosterir. */
    private String avatarUrl;

    public TeamMember(Long id, Long teamId, String fullName, String role, String email,
                       LocalDate startDate, String statusCode, BigDecimal targetWorkDays,
                       boolean targetWorkDaysOverridden) {
        this.id = id;
        this.teamId = teamId;
        this.fullName = fullName;
        this.role = role;
        this.email = email;
        this.startDate = startDate;
        this.statusCode = statusCode;
        this.targetWorkDays = targetWorkDays;
        this.targetWorkDaysOverridden = targetWorkDaysOverridden;
        this.customFieldValues = new HashMap<>();
    }
}
