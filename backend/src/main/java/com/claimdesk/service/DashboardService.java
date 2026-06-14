package com.claimdesk.service;

import com.claimdesk.dto.AdminDashboardResponse;
import com.claimdesk.dto.AdminDashboardSummaryResponse;
import com.claimdesk.dto.AuditLogResponse;
import com.claimdesk.dto.DashboardBreakdownResponse;
import com.claimdesk.dto.DashboardSummaryResponse;
import com.claimdesk.dto.EmployeeDashboardResponse;
import com.claimdesk.dto.EmployeeDashboardSummaryResponse;
import com.claimdesk.dto.EmployeeRecentClaimResponse;
import com.claimdesk.entity.AuditLog;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.AuditLogRepository;
import com.claimdesk.repository.DepartmentRepository;
import com.claimdesk.repository.ExpenseCategoryRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DashboardService {

    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ExpenseCategoryRepository categoryRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardService(
            ExpenseClaimRepository claimRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            ExpenseCategoryRepository categoryRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getRole() == Role.EMPLOYEE) {
            return employeeSummary(user);
        }

        if (user.getRole() == Role.MANAGER) {
            return managerSummary(user);
        }

        if (user.getRole() == Role.FINANCE) {
            return financeSummary();
        }

        return adminSummary();
    }

    @Transactional(readOnly = true)
    public EmployeeDashboardResponse getEmployeeDashboard(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getRole() != Role.EMPLOYEE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Employee dashboard is only available for employees");
        }

        Long employeeId = user.getId();
        EmployeeDashboardSummaryResponse summary = new EmployeeDashboardSummaryResponse(
                claimRepository.countByEmployeeIdAndStatus(employeeId, ClaimStatus.DRAFT),
                claimRepository.countByEmployeeIdAndStatus(employeeId, ClaimStatus.SUBMITTED),
                claimRepository.countByEmployeeIdAndStatus(employeeId, ClaimStatus.MANAGER_REJECTED),
                claimRepository.countByEmployeeIdAndStatus(employeeId, ClaimStatus.PAID),
                claimRepository.sumAmountByEmployeeId(employeeId),
                claimRepository.sumAmountByEmployeeIdAndStatus(employeeId, ClaimStatus.PAID),
                claimRepository.sumAmountByEmployeeIdAndStatusNotIn(
                        employeeId,
                        List.of(ClaimStatus.PAID, ClaimStatus.MANAGER_REJECTED, ClaimStatus.CANCELLED)
                )
        );

        return new EmployeeDashboardResponse(
                summary,
                employeeStatusBreakdown(employeeId),
                employeeMonthlyTrend(employeeId),
                employeeCategoryBreakdown(employeeId),
                employeeRecentClaims(employeeId)
        );
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin dashboard is only available for admins");
        }

        AdminDashboardSummaryResponse summary = new AdminDashboardSummaryResponse(
                userRepository.countByActiveTrue(),
                userRepository.countByActiveFalse(),
                departmentRepository.countByActiveTrue(),
                departmentRepository.countByActiveFalse(),
                categoryRepository.countByActiveTrue(),
                categoryRepository.countByActiveFalse(),
                claimRepository.count(),
                claimRepository.sumAllAmounts(),
                claimRepository.sumAmountByStatus(ClaimStatus.PAID),
                claimRepository.countByStatusNotIn(List.of(ClaimStatus.PAID, ClaimStatus.MANAGER_REJECTED, ClaimStatus.CANCELLED))
        );

        return new AdminDashboardResponse(
                summary,
                userRoleBreakdown(),
                claimStatusBreakdown(),
                adminMonthlyTrend(),
                adminDepartmentBreakdown(),
                adminCategoryBreakdown(),
                recentAuditLogs()
        );
    }

    private DashboardSummaryResponse employeeSummary(User user) {
        return new DashboardSummaryResponse(
                Role.EMPLOYEE,
                claimRepository.countByEmployeeIdAndStatus(user.getId(), ClaimStatus.DRAFT),
                claimRepository.countByEmployeeIdAndStatus(user.getId(), ClaimStatus.SUBMITTED),
                claimRepository.countByEmployeeIdAndStatus(user.getId(), ClaimStatus.MANAGER_REJECTED),
                claimRepository.countByEmployeeIdAndStatus(user.getId(), ClaimStatus.PAID),
                claimRepository.sumAmountByEmployeeId(user.getId()),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private DashboardSummaryResponse managerSummary(User user) {
        return new DashboardSummaryResponse(
                Role.MANAGER,
                null,
                null,
                null,
                null,
                null,
                claimRepository.countManagerClaimsByStatus(user.getId(), ClaimStatus.SUBMITTED),
                claimRepository.countManagerClaimsByStatus(user.getId(), ClaimStatus.MANAGER_APPROVED),
                claimRepository.countManagerClaimsByStatus(user.getId(), ClaimStatus.MANAGER_REJECTED),
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    private DashboardSummaryResponse financeSummary() {
        return new DashboardSummaryResponse(
                Role.FINANCE,
                null,
                null,
                null,
                claimRepository.countByStatus(ClaimStatus.PAID),
                null,
                null,
                null,
                null,
                claimRepository.countByStatus(ClaimStatus.MANAGER_APPROVED),
                claimRepository.countByStatus(ClaimStatus.FINANCE_APPROVED),
                claimRepository.sumAmountByStatus(ClaimStatus.PAID),
                null,
                null,
                null
        );
    }

    private DashboardSummaryResponse adminSummary() {
        return new DashboardSummaryResponse(
                Role.ADMIN,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                userRepository.countByActiveTrue(),
                departmentRepository.countByActiveTrue(),
                categoryRepository.countByActiveTrue()
        );
    }

    private List<DashboardBreakdownResponse> employeeStatusBreakdown(Long employeeId) {
        Map<ClaimStatus, DashboardBreakdownResponse> breakdown = new EnumMap<>(ClaimStatus.class);
        claimRepository.employeeStatusBreakdown(employeeId)
                .forEach(row -> {
                    ClaimStatus status = (ClaimStatus) row[0];
                    breakdown.put(status, new DashboardBreakdownResponse(
                            status.name(),
                            (Long) row[1],
                            (BigDecimal) row[2]
                    ));
                });

        return List.of(ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.MANAGER_APPROVED,
                        ClaimStatus.MANAGER_REJECTED, ClaimStatus.FINANCE_APPROVED, ClaimStatus.PAID,
                        ClaimStatus.CANCELLED)
                .stream()
                .map(status -> breakdown.getOrDefault(status, new DashboardBreakdownResponse(status.name(), 0L, BigDecimal.ZERO)))
                .toList();
    }

    private List<DashboardBreakdownResponse> employeeMonthlyTrend(Long employeeId) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(5);
        Map<YearMonth, MonthlyTotal> totals = new java.util.LinkedHashMap<>();

        for (int i = 0; i < 6; i++) {
            totals.put(firstMonth.plusMonths(i), new MonthlyTotal());
        }

        LocalDate startDate = firstMonth.atDay(1);
        for (ExpenseClaim claim : claimRepository.findEmployeeClaimsSince(employeeId, startDate)) {
            YearMonth month = YearMonth.from(claim.getTransactionDate());
            MonthlyTotal total = totals.get(month);
            if (total != null) {
                total.count++;
                total.amount = total.amount.add(claim.getAmount());
            }
        }

        return totals.entrySet()
                .stream()
                .map(entry -> new DashboardBreakdownResponse(
                        entry.getKey().toString(),
                        entry.getValue().count,
                        entry.getValue().amount
                ))
                .toList();
    }

    private List<DashboardBreakdownResponse> employeeCategoryBreakdown(Long employeeId) {
        return claimRepository.employeeCategoryBreakdown(employeeId)
                .stream()
                .map(row -> new DashboardBreakdownResponse((String) row[0], (Long) row[1], (BigDecimal) row[2]))
                .toList();
    }

    private List<EmployeeRecentClaimResponse> employeeRecentClaims(Long employeeId) {
        return claimRepository.findRecentEmployeeClaims(employeeId, PageRequest.of(0, 5))
                .stream()
                .map(claim -> new EmployeeRecentClaimResponse(
                        claim.getId(),
                        claim.getTitle(),
                        claim.getAmount(),
                        claim.getStatus(),
                        claim.getCategory().getName(),
                        claim.getTransactionDate(),
                        claim.getUpdatedAt()
                ))
                .toList();
    }

    private List<DashboardBreakdownResponse> userRoleBreakdown() {
        Map<Role, DashboardBreakdownResponse> breakdown = new EnumMap<>(Role.class);
        userRepository.roleBreakdown()
                .forEach(row -> {
                    Role role = (Role) row[0];
                    breakdown.put(role, new DashboardBreakdownResponse(role.name(), (Long) row[1], BigDecimal.ZERO));
                });

        return List.of(Role.ADMIN, Role.EMPLOYEE, Role.MANAGER, Role.FINANCE)
                .stream()
                .map(role -> breakdown.getOrDefault(role, new DashboardBreakdownResponse(role.name(), 0L, BigDecimal.ZERO)))
                .toList();
    }

    private List<DashboardBreakdownResponse> claimStatusBreakdown() {
        Map<ClaimStatus, DashboardBreakdownResponse> breakdown = new EnumMap<>(ClaimStatus.class);
        claimRepository.statusBreakdown()
                .forEach(row -> {
                    ClaimStatus status = (ClaimStatus) row[0];
                    breakdown.put(status, new DashboardBreakdownResponse(status.name(), (Long) row[1], (BigDecimal) row[2]));
                });

        return List.of(ClaimStatus.DRAFT, ClaimStatus.SUBMITTED, ClaimStatus.MANAGER_APPROVED,
                        ClaimStatus.MANAGER_REJECTED, ClaimStatus.FINANCE_APPROVED, ClaimStatus.PAID,
                        ClaimStatus.CANCELLED)
                .stream()
                .map(status -> breakdown.getOrDefault(status, new DashboardBreakdownResponse(status.name(), 0L, BigDecimal.ZERO)))
                .toList();
    }

    private List<DashboardBreakdownResponse> adminMonthlyTrend() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth firstMonth = currentMonth.minusMonths(5);
        Map<YearMonth, MonthlyTotal> totals = new java.util.LinkedHashMap<>();

        for (int i = 0; i < 6; i++) {
            totals.put(firstMonth.plusMonths(i), new MonthlyTotal());
        }

        LocalDate startDate = firstMonth.atDay(1);
        for (ExpenseClaim claim : claimRepository.findClaimsSince(startDate)) {
            YearMonth month = YearMonth.from(claim.getTransactionDate());
            MonthlyTotal total = totals.get(month);
            if (total != null) {
                total.count++;
                total.amount = total.amount.add(claim.getAmount());
            }
        }

        return totals.entrySet()
                .stream()
                .map(entry -> new DashboardBreakdownResponse(entry.getKey().toString(), entry.getValue().count, entry.getValue().amount))
                .toList();
    }

    private List<DashboardBreakdownResponse> adminDepartmentBreakdown() {
        return claimRepository.departmentBreakdown()
                .stream()
                .map(row -> new DashboardBreakdownResponse((String) row[0], (Long) row[1], (BigDecimal) row[2]))
                .toList();
    }

    private List<DashboardBreakdownResponse> adminCategoryBreakdown() {
        return claimRepository.categoryBreakdown()
                .stream()
                .map(row -> new DashboardBreakdownResponse((String) row[0], (Long) row[1], (BigDecimal) row[2]))
                .toList();
    }

    private List<AuditLogResponse> recentAuditLogs() {
        return auditLogRepository.findRecent(PageRequest.of(0, 5))
                .stream()
                .map(this::toAuditLogResponse)
                .toList();
    }

    private AuditLogResponse toAuditLogResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getActorId(),
                auditLog.getActorEmail(),
                auditLog.getActorRole(),
                auditLog.getAction(),
                auditLog.getResourceType(),
                auditLog.getResourceId(),
                auditLog.getDescription(),
                auditLog.getMetadata(),
                auditLog.getCreatedAt()
        );
    }

    private static class MonthlyTotal {
        private long count;
        private BigDecimal amount = BigDecimal.ZERO;
    }
}
