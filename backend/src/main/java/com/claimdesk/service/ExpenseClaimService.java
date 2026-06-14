package com.claimdesk.service;

import com.claimdesk.dto.ClaimCategoryResponse;
import com.claimdesk.dto.ClaimRequest;
import com.claimdesk.dto.ClaimResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.SimpleUserResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.ExpenseCategory;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.ExpenseCategoryRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.time.LocalDate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpenseClaimService {

    private final ExpenseClaimRepository claimRepository;
    private final ExpenseCategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ExpenseClaimService(
            ExpenseClaimRepository claimRepository,
            ExpenseCategoryRepository categoryRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.claimRepository = claimRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ClaimResponse> listClaims(
            String email,
            String search,
            ClaimStatus status,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        User employee = resolveEmployee(email);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(claimRepository
                .searchEmployeeClaims(employee.getId(), search, status, categoryId, dateFrom, dateTo, pageable)
                .map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaim(String email, Long id) {
        User employee = resolveEmployee(email);
        return toResponse(findOwnedClaim(id, employee));
    }

    @Transactional
    public ClaimResponse createClaim(String email, ClaimRequest request) {
        User employee = resolveEmployee(email);
        ExpenseCategory category = resolveActiveCategory(request.categoryId());
        validateTransactionDate(request.transactionDate());

        ExpenseClaim claim = new ExpenseClaim(
                employee,
                category,
                request.title().trim(),
                normalizeDescription(request.description()),
                request.amount(),
                request.transactionDate()
        );

        ExpenseClaim saved = claimRepository.save(claim);
        auditLogService.record(
                employee.getEmail(),
                AuditAction.CLAIM_CREATED,
                AuditResourceType.CLAIM,
                saved.getId(),
                employee.getName() + " created claim " + saved.getTitle() + ".",
                "{\"status\":\"" + saved.getStatus() + "\",\"amount\":" + saved.getAmount() + "}"
        );
        return toResponse(saved);
    }

    @Transactional
    public ClaimResponse updateClaim(String email, Long id, ClaimRequest request) {
        User employee = resolveEmployee(email);
        ExpenseClaim claim = findOwnedClaim(id, employee);
        if (claim.getStatus() != ClaimStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft claims can be updated");
        }

        ExpenseCategory category = resolveActiveCategory(request.categoryId());
        validateTransactionDate(request.transactionDate());
        claim.updateDraft(
                category,
                request.title().trim(),
                normalizeDescription(request.description()),
                request.amount(),
                request.transactionDate()
        );

        auditLogService.record(
                employee.getEmail(),
                AuditAction.CLAIM_UPDATED,
                AuditResourceType.CLAIM,
                claim.getId(),
                employee.getName() + " updated claim " + claim.getTitle() + ".",
                "{\"status\":\"" + claim.getStatus() + "\",\"amount\":" + claim.getAmount() + "}"
        );
        return toResponse(claim);
    }

    @Transactional
    public ClaimResponse submitClaim(String email, Long id) {
        User employee = resolveEmployee(email);
        ExpenseClaim claim = findOwnedClaim(id, employee);
        if (claim.getStatus() != ClaimStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft claims can be submitted");
        }

        claim.submit();
        notificationService.notifyClaimSubmitted(claim);
        auditLogService.record(
                employee.getEmail(),
                AuditAction.CLAIM_SUBMITTED,
                AuditResourceType.CLAIM,
                claim.getId(),
                employee.getName() + " submitted claim " + claim.getTitle() + ".",
                "{\"status\":\"" + claim.getStatus() + "\",\"amount\":" + claim.getAmount() + "}"
        );
        return toResponse(claim);
    }

    @Transactional
    public ClaimResponse cancelClaim(String email, Long id) {
        User employee = resolveEmployee(email);
        ExpenseClaim claim = findOwnedClaim(id, employee);
        if (claim.getStatus() != ClaimStatus.DRAFT && claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only draft or submitted claims can be cancelled");
        }

        claim.cancel();
        auditLogService.record(
                employee.getEmail(),
                AuditAction.CLAIM_CANCELLED,
                AuditResourceType.CLAIM,
                claim.getId(),
                employee.getName() + " cancelled claim " + claim.getTitle() + ".",
                "{\"status\":\"" + claim.getStatus() + "\"}"
        );
        return toResponse(claim);
    }

    private User resolveEmployee(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is inactive");
        }

        if (user.getRole() != Role.EMPLOYEE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only employees can access claims");
        }

        return user;
    }

    private ExpenseClaim findOwnedClaim(Long id, User employee) {
        return claimRepository.findByIdAndEmployeeId(id, employee.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private ExpenseCategory resolveActiveCategory(Long categoryId) {
        ExpenseCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        if (!category.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category must be active");
        }

        return category;
    }

    private void validateTransactionDate(LocalDate transactionDate) {
        if (transactionDate.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transaction date cannot be in the future");
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private ClaimResponse toResponse(ExpenseClaim claim) {
        return new ClaimResponse(
                claim.getId(),
                claim.getTitle(),
                claim.getDescription(),
                claim.getAmount(),
                claim.getTransactionDate(),
                claim.getStatus(),
                claim.getSubmittedAt(),
                new ClaimCategoryResponse(claim.getCategory().getId(), claim.getCategory().getName()),
                new SimpleUserResponse(
                        claim.getEmployee().getId(),
                        claim.getEmployee().getName(),
                        claim.getEmployee().getEmail()
                ),
                claim.getCreatedAt(),
                claim.getUpdatedAt()
        );
    }
}
