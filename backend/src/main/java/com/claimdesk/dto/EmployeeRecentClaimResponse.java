package com.claimdesk.dto;

import com.claimdesk.entity.ClaimStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EmployeeRecentClaimResponse(
        Long id,
        String title,
        BigDecimal amount,
        ClaimStatus status,
        String categoryName,
        LocalDate transactionDate,
        OffsetDateTime updatedAt
) {
}
