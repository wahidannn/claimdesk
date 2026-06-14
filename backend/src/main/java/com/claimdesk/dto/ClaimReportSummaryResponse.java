package com.claimdesk.dto;

import java.math.BigDecimal;
import java.util.List;

public record ClaimReportSummaryResponse(
        long totalClaims,
        BigDecimal totalAmount,
        long paidClaims,
        BigDecimal paidAmount,
        long pendingClaims,
        long rejectedClaims,
        List<ClaimReportBreakdownResponse> byStatus,
        List<ClaimReportBreakdownResponse> byCategory,
        List<ClaimReportBreakdownResponse> byDepartment
) {
}
