package com.claimdesk.dto;

import java.math.BigDecimal;

public record AdminDashboardSummaryResponse(
        Long activeUsers,
        Long inactiveUsers,
        Long activeDepartments,
        Long inactiveDepartments,
        Long activeCategories,
        Long inactiveCategories,
        Long totalClaims,
        BigDecimal totalClaimAmount,
        BigDecimal paidAmount,
        Long pendingClaims
) {
}
