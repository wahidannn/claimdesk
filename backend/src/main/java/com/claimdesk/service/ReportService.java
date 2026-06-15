package com.claimdesk.service;

import com.claimdesk.config.CacheConfig;
import com.claimdesk.dto.ClaimReportBreakdownResponse;
import com.claimdesk.dto.ClaimReportRowResponse;
import com.claimdesk.dto.ClaimReportSummaryResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.Department;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReportService {

    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final CsvExportService csvExportService;
    private final AuditLogService auditLogService;

    public ReportService(
            ExpenseClaimRepository claimRepository,
            UserRepository userRepository,
            CsvExportService csvExportService,
            AuditLogService auditLogService
    ) {
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.csvExportService = csvExportService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ClaimReportRowResponse> listClaims(
            String actorEmail,
            String search,
            ClaimStatus status,
            Long departmentId,
            Long employeeId,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        User actor = resolveActor(actorEmail);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ExpenseClaim> claims = searchClaims(actor, search, status, departmentId, employeeId, categoryId, dateFrom, dateTo, pageable);
        return PagedResponse.from(claims.map(this::toRow));
    }

    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = CacheConfig.CLAIM_REPORT_SUMMARY,
            key = "T(java.util.Objects).hash(#actorEmail, #search, #status, #departmentId, #employeeId, #categoryId, #dateFrom, #dateTo)"
    )
    public ClaimReportSummaryResponse getSummary(
            String actorEmail,
            String search,
            ClaimStatus status,
            Long departmentId,
            Long employeeId,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        User actor = resolveActor(actorEmail);
        List<ExpenseClaim> claims = searchClaims(
                actor,
                search,
                status,
                departmentId,
                employeeId,
                categoryId,
                dateFrom,
                dateTo,
                Pageable.unpaged()
        ).getContent();

        BigDecimal totalAmount = claims.stream()
                .map(ExpenseClaim::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidAmount = claims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.PAID)
                .map(ExpenseClaim::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidClaims = claims.stream().filter(claim -> claim.getStatus() == ClaimStatus.PAID).count();
        long pendingClaims = claims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.SUBMITTED
                        || claim.getStatus() == ClaimStatus.REVISION_REQUESTED
                        || claim.getStatus() == ClaimStatus.REVISED
                        || claim.getStatus() == ClaimStatus.MANAGER_APPROVED
                        || claim.getStatus() == ClaimStatus.FINANCE_APPROVED)
                .count();
        long rejectedClaims = claims.stream()
                .filter(claim -> claim.getStatus() == ClaimStatus.MANAGER_REJECTED)
                .count();

        return new ClaimReportSummaryResponse(
                claims.size(),
                totalAmount,
                paidClaims,
                paidAmount,
                pendingClaims,
                rejectedClaims,
                breakdown(claims, claim -> claim.getStatus().name()),
                breakdown(claims, claim -> claim.getCategory().getName()),
                breakdown(claims, claim -> {
                    Department department = claim.getEmployee().getDepartment();
                    return department == null ? "No Department" : department.getName();
                })
        );
    }

    @Transactional
    public String exportClaims(
            String actorEmail,
            String search,
            ClaimStatus status,
            Long departmentId,
            Long employeeId,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        User actor = resolveActor(actorEmail);
        List<ClaimReportRowResponse> rows = searchClaims(
                actor,
                search,
                status,
                departmentId,
                employeeId,
                categoryId,
                dateFrom,
                dateTo,
                Pageable.unpaged()
        ).stream().map(this::toRow).toList();

        auditLogService.record(
                actorEmail,
                AuditAction.REPORT_CLAIMS_EXPORTED,
                AuditResourceType.CLAIM,
                null,
                actor.getEmail() + " exported claim report.",
                "{\"rows\":" + rows.size() + "}"
        );

        return csvExportService.toCsv(
                List.of(
                        "Claim ID",
                        "Title",
                        "Employee Name",
                        "Employee Email",
                        "Department",
                        "Category",
                        "Amount",
                        "Transaction Date",
                        "Status",
                        "Submitted At",
                        "Manager Reviewed At",
                        "Finance Reviewed At",
                        "Paid At"
                ),
                rows.stream().map(row -> List.of(
                        string(row.claimId()),
                        row.title(),
                        row.employeeName(),
                        row.employeeEmail(),
                        string(row.departmentName()),
                        row.categoryName(),
                        string(row.amount()),
                        string(row.transactionDate()),
                        row.status().name(),
                        string(row.submittedAt()),
                        string(row.managerReviewedAt()),
                        string(row.financeReviewedAt()),
                        string(row.paidAt())
                )).toList()
        );
    }

    private Page<ExpenseClaim> searchClaims(
            User actor,
            String search,
            ClaimStatus status,
            Long departmentId,
            Long employeeId,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable
    ) {
        Long employeeScopeId = actor.getRole() == Role.EMPLOYEE ? actor.getId() : null;
        Long managerScopeId = actor.getRole() == Role.MANAGER ? actor.getId() : null;
        Long effectiveEmployeeId = actor.getRole() == Role.EMPLOYEE ? null : employeeId;
        Long effectiveDepartmentId = actor.getRole() == Role.EMPLOYEE ? null : departmentId;

        return claimRepository.searchReportClaims(
                employeeScopeId,
                managerScopeId,
                search,
                status,
                effectiveDepartmentId,
                effectiveEmployeeId,
                categoryId,
                dateFrom,
                dateTo,
                pageable
        );
    }

    private User resolveActor(String actorEmail) {
        return userRepository.findByEmailIgnoreCase(actorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private ClaimReportRowResponse toRow(ExpenseClaim claim) {
        Department department = claim.getEmployee().getDepartment();
        return new ClaimReportRowResponse(
                claim.getId(),
                claim.getTitle(),
                claim.getEmployee().getName(),
                claim.getEmployee().getEmail(),
                department == null ? null : department.getName(),
                claim.getCategory().getName(),
                claim.getAmount(),
                claim.getTransactionDate(),
                claim.getStatus(),
                claim.getSubmittedAt(),
                claim.getManagerReviewedAt(),
                claim.getFinanceReviewedAt(),
                claim.getPaidAt()
        );
    }

    private List<ClaimReportBreakdownResponse> breakdown(List<ExpenseClaim> claims, LabelResolver labelResolver) {
        Map<String, BreakdownAccumulator> grouped = new LinkedHashMap<>();
        claims.forEach(claim -> {
            String label = labelResolver.label(claim);
            BreakdownAccumulator accumulator = grouped.computeIfAbsent(label, key -> new BreakdownAccumulator());
            accumulator.count++;
            accumulator.amount = accumulator.amount.add(claim.getAmount());
        });

        List<ClaimReportBreakdownResponse> result = new ArrayList<>();
        grouped.forEach((label, accumulator) -> result.add(new ClaimReportBreakdownResponse(
                label,
                accumulator.count,
                accumulator.amount
        )));
        result.sort(Comparator.comparing(ClaimReportBreakdownResponse::amount).reversed());
        return result;
    }

    private String string(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    @FunctionalInterface
    private interface LabelResolver {
        String label(ExpenseClaim claim);
    }

    private static class BreakdownAccumulator {
        private long count;
        private BigDecimal amount = BigDecimal.ZERO;
    }
}
