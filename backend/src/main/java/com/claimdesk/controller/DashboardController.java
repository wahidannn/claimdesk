package com.claimdesk.controller;

import com.claimdesk.dto.AdminDashboardResponse;
import com.claimdesk.dto.DashboardSummaryResponse;
import com.claimdesk.dto.EmployeeDashboardResponse;
import com.claimdesk.dto.FinanceDashboardResponse;
import com.claimdesk.dto.ManagerDashboardResponse;
import com.claimdesk.service.DashboardService;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary(Principal principal) {
        return dashboardService.getSummary(principal.getName());
    }

    @GetMapping("/employee")
    public EmployeeDashboardResponse getEmployeeDashboard(Principal principal) {
        return dashboardService.getEmployeeDashboard(principal.getName());
    }

    @GetMapping("/admin")
    public AdminDashboardResponse getAdminDashboard(Principal principal) {
        return dashboardService.getAdminDashboard(principal.getName());
    }

    @GetMapping("/manager")
    public ManagerDashboardResponse getManagerDashboard(Principal principal) {
        return dashboardService.getManagerDashboard(principal.getName());
    }

    @GetMapping("/finance")
    public FinanceDashboardResponse getFinanceDashboard(Principal principal) {
        return dashboardService.getFinanceDashboard(principal.getName());
    }
}
