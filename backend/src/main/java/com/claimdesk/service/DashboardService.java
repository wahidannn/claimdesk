package com.claimdesk.service;

import com.claimdesk.dto.DashboardSummaryResponse;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.DepartmentRepository;
import com.claimdesk.repository.ExpenseCategoryRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.math.BigDecimal;
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

    public DashboardService(
            ExpenseClaimRepository claimRepository,
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            ExpenseCategoryRepository categoryRepository
    ) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
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
}
