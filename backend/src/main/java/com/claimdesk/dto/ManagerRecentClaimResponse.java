package com.claimdesk.dto;

import com.claimdesk.entity.ClaimStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ManagerRecentClaimResponse(
        Long id,
        String title,
        BigDecimal amount,
        ClaimStatus status,
        String employeeName,
        String categoryName,
        LocalDate transactionDate,
        OffsetDateTime submittedAt
) {
}
