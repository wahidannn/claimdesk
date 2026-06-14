package com.claimdesk.dto;

import java.util.List;

public record EmployeeDashboardResponse(
        EmployeeDashboardSummaryResponse summary,
        List<DashboardBreakdownResponse> statusBreakdown,
        List<DashboardBreakdownResponse> monthlyTrend,
        List<DashboardBreakdownResponse> categoryBreakdown,
        List<EmployeeRecentClaimResponse> recentClaims
) {
}
