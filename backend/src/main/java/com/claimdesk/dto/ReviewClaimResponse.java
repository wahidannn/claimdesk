package com.claimdesk.dto;

import com.claimdesk.entity.ClaimStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record ReviewClaimResponse(
        Long id,
        String title,
        String description,
        BigDecimal amount,
        LocalDate transactionDate,
        ClaimStatus status,
        ClaimCategoryResponse category,
        SimpleUserResponse employee,
        SimpleDepartmentResponse department,
        List<AttachmentResponse> attachments,
        List<ApprovalNoteResponse> approvalNotes,
        OffsetDateTime submittedAt,
        OffsetDateTime managerReviewedAt,
        OffsetDateTime financeReviewedAt,
        OffsetDateTime paidAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
