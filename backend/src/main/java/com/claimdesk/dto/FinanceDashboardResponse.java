package com.claimdesk.dto;

import java.util.List;

public record FinanceDashboardResponse(
        FinanceDashboardSummaryResponse summary,
        List<DashboardBreakdownResponse> statusBreakdown,
        List<DashboardBreakdownResponse> monthlyPaidTrend,
        List<DashboardBreakdownResponse> categoryBreakdown,
        List<DashboardBreakdownResponse> departmentBreakdown,
        List<FinanceRecentClaimResponse> recentReviewClaims
) {
}
