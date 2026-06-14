package com.claimdesk.dto;

import java.math.BigDecimal;

public record EmployeeDashboardSummaryResponse(
        Long draftClaims,
        Long submittedClaims,
        Long rejectedClaims,
        Long paidClaims,
        BigDecimal totalClaimAmount,
        BigDecimal paidAmount,
        BigDecimal pendingAmount
) {
}
