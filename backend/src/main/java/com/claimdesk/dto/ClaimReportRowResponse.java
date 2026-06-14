package com.claimdesk.dto;

import com.claimdesk.entity.ClaimStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ClaimReportRowResponse(
        Long claimId,
        String title,
        String employeeName,
        String employeeEmail,
        String departmentName,
        String categoryName,
        BigDecimal amount,
        LocalDate transactionDate,
        ClaimStatus status,
        OffsetDateTime submittedAt,
        OffsetDateTime managerReviewedAt,
        OffsetDateTime financeReviewedAt,
        OffsetDateTime paidAt
) {
}
