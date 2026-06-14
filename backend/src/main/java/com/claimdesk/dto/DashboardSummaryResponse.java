package com.claimdesk.dto;

import com.claimdesk.entity.Role;
import java.math.BigDecimal;

public record DashboardSummaryResponse(
        Role role,
        Long draftClaims,
        Long submittedClaims,
        Long rejectedClaims,
        Long paidClaims,
        BigDecimal totalClaimAmount,
        Long pendingApprovals,
        Long approvedByManager,
        Long rejectedByManager,
        Long pendingFinanceReview,
        Long financeApproved,
        BigDecimal paidAmount,
        Long activeUsers,
        Long activeDepartments,
        Long activeCategories
) {
}
