package com.claimdesk.dto;

import com.claimdesk.entity.ClaimStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ClaimResponse(
        Long id,
        String title,
        String description,
        BigDecimal amount,
        LocalDate transactionDate,
        ClaimStatus status,
        OffsetDateTime submittedAt,
        ClaimCategoryResponse category,
        SimpleUserResponse employee,
        String latestRevisionNote,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
