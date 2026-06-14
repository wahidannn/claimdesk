package com.claimdesk.dto;

import java.math.BigDecimal;

public record ManagerDashboardSummaryResponse(
        Long pendingApprovals,
        Long approvedByManager,
        Long rejectedByManager,
        BigDecimal pendingAmount,
        BigDecimal reviewedAmount,
        Long totalDepartmentClaims
) {
}
