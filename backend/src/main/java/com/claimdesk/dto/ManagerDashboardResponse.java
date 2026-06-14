package com.claimdesk.dto;

import java.util.List;

public record ManagerDashboardResponse(
        ManagerDashboardSummaryResponse summary,
        List<DashboardBreakdownResponse> statusBreakdown,
        List<DashboardBreakdownResponse> monthlyTrend,
        List<DashboardBreakdownResponse> categoryBreakdown,
        List<DashboardBreakdownResponse> employeeBreakdown,
        List<ManagerRecentClaimResponse> recentPendingClaims
) {
}
