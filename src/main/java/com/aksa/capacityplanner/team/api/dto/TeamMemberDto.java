package com.aksa.capacityplanner.team.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record TeamMemberDto(Long id, Long teamId, String fullName, String role, String email,
                             LocalDate startDate, String statusCode, BigDecimal targetWorkDays,
                             boolean targetWorkDaysOverridden, Map<String, String> customFieldValues) {
}
