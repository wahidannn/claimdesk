package com.claimdesk.dto;

import java.math.BigDecimal;

public record FinanceDashboardSummaryResponse(
        Long pendingFinanceReview,
        Long financeApproved,
        Long paidClaims,
        Long pendingPaymentClaims,
        BigDecimal pendingReviewAmount,
        BigDecimal approvedAmount,
        BigDecimal paidAmount,
        Long totalFinanceClaims
) {
}
