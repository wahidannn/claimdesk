package com.claimdesk.dto;

import java.util.List;

public record AdminDashboardResponse(
        AdminDashboardSummaryResponse summary,
        List<DashboardBreakdownResponse> userRoleBreakdown,
        List<DashboardBreakdownResponse> claimStatusBreakdown,
        List<DashboardBreakdownResponse> monthlyClaimTrend,
        List<DashboardBreakdownResponse> departmentBreakdown,
        List<DashboardBreakdownResponse> categoryBreakdown,
        List<AuditLogResponse> recentAuditLogs
) {
}
