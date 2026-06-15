package com.claimdesk.service;

import com.claimdesk.config.CacheConfig;
import com.claimdesk.dto.ApprovalNoteResponse;
import com.claimdesk.dto.AttachmentResponse;
import com.claimdesk.dto.ClaimCategoryResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.ReviewClaimResponse;
import com.claimdesk.dto.ReviewUserResponse;
import com.claimdesk.dto.SimpleDepartmentResponse;
import com.claimdesk.dto.SimpleUserResponse;
import com.claimdesk.entity.ApprovalAction;
import com.claimdesk.entity.ApprovalNote;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.Department;
import com.claimdesk.entity.ExpenseAttachment;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.ApprovalNoteRepository;
import com.claimdesk.repository.ExpenseAttachmentRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApprovalWorkflowService {

    private static final Set<ClaimStatus> FINANCE_QUEUE_STATUSES = Set.of(
            ClaimStatus.MANAGER_APPROVED,
            ClaimStatus.FINANCE_APPROVED
    );

    private final ExpenseClaimRepository claimRepository;
    private final ApprovalNoteRepository approvalNoteRepository;
    private final ExpenseAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ApprovalWorkflowService(
            ExpenseClaimRepository claimRepository,
            ApprovalNoteRepository approvalNoteRepository,
            ExpenseAttachmentRepository attachmentRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.claimRepository = claimRepository;
        this.approvalNoteRepository = approvalNoteRepository;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewClaimResponse> listManagerClaims(
            String email,
            String search,
            ClaimStatus status,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        User manager = resolveUser(email, Role.MANAGER);
        ClaimStatus effectiveStatus = status == null ? ClaimStatus.SUBMITTED : status;
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(claimRepository
                .searchManagerClaims(manager.getId(), search, effectiveStatus, categoryId, dateFrom, dateTo, pageable)
                .map(this::toReviewResponse));
    }

    @Transactional(readOnly = true)
    public ReviewClaimResponse getManagerClaim(String email, Long id) {
        User manager = resolveUser(email, Role.MANAGER);
        ExpenseClaim claim = findClaim(id);
        validateManagerClaimAccess(manager, claim);
        return toReviewResponse(claim);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.MANAGER_DASHBOARD,
                    CacheConfig.EMPLOYEE_DASHBOARD,
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public ReviewClaimResponse managerApprove(String email, Long id, String note) {
        User manager = resolveUser(email, Role.MANAGER);
        ExpenseClaim claim = findClaim(id);
        validateManagerClaimAccess(manager, claim);
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only submitted claims can be approved by manager");
        }

        claim.managerApprove();
        approvalNoteRepository.save(new ApprovalNote(claim, manager, ApprovalAction.MANAGER_APPROVED, normalizeNote(note)));
        notificationService.notifyManagerApproved(claim);
        auditLogService.record(
                manager.getEmail(),
                AuditAction.CLAIM_MANAGER_APPROVED,
                AuditResourceType.CLAIM,
                claim.getId(),
                manager.getName() + " approved claim " + claim.getTitle() + ".",
                "{\"status\":\"" + claim.getStatus() + "\"}"
        );
        return toReviewResponse(claim);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.MANAGER_DASHBOARD,
                    CacheConfig.EMPLOYEE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public ReviewClaimResponse managerReject(String email, Long id, String note) {
        User manager = resolveUser(email, Role.MANAGER);
        ExpenseClaim claim = findClaim(id);
        validateManagerClaimAccess(manager, claim);
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only submitted claims can be rejected by manager");
        }

        String normalizedNote = normalizeNote(note);
        if (normalizedNote == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reject note is required");
        }

        claim.managerReject();
        approvalNoteRepository.save(new ApprovalNote(claim, manager, ApprovalAction.MANAGER_REJECTED, normalizedNote));
        notificationService.notifyManagerRejected(claim);
        auditLogService.record(
                manager.getEmail(),
                AuditAction.CLAIM_MANAGER_REJECTED,
                AuditResourceType.CLAIM,
                claim.getId(),
                manager.getName() + " rejected claim " + claim.getTitle() + ".",
                "{\"status\":\"" + claim.getStatus() + "\"}"
        );
        return toReviewResponse(claim);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ReviewClaimResponse> listFinanceClaims(
            String email,
            String search,
            ClaimStatus status,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        resolveUser(email, Role.FINANCE);
        Set<ClaimStatus> statuses = status == null ? FINANCE_QUEUE_STATUSES : Set.of(validateFinanceListStatus(status));
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(claimRepository
                .searchFinanceClaims(statuses, search, categoryId, dateFrom, dateTo, pageable)
                .map(this::toReviewResponse));
    }

    @Transactional(readOnly = true)
    public ReviewClaimResponse getFinanceClaim(String email, Long id) {
        resolveUser(email, Role.FINANCE);
        ExpenseClaim claim = findClaim(id);
        if (!FINANCE_QUEUE_STATUSES.contains(claim.getStatus()) && claim.getStatus() != ClaimStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
        }

        return toReviewResponse(claim);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.EMPLOYEE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public ReviewClaimResponse financeApprove(String email, Long id, String note) {
        User finance = resolveUser(email, Role.FINANCE);
        ExpenseClaim claim = findClaim(id);
        if (claim.getStatus() != ClaimStatus.MANAGER_APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only manager approved claims can be approved by finance");
        }

        claim.financeApprove();
        approvalNoteRepository.save(new ApprovalNote(claim, finance, ApprovalAction.FINANCE_APPROVED, normalizeNote(note)));
        notificationService.notifyFinanceApproved(claim);
        auditLogService.record(
                finance.getEmail(),
                AuditAction.CLAIM_FINANCE_APPROVED,
                AuditResourceType.CLAIM,
                claim.getId(),
                finance.getName() + " approved claim " + claim.getTitle() + " for finance.",
                "{\"status\":\"" + claim.getStatus() + "\"}"
        );
        return toReviewResponse(claim);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.EMPLOYEE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public ReviewClaimResponse markPaid(String email, Long id, String note) {
        User finance = resolveUser(email, Role.FINANCE);
        ExpenseClaim claim = findClaim(id);
        if (claim.getStatus() != ClaimStatus.FINANCE_APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only finance approved claims can be marked as paid");
        }

        claim.markPaid();
        approvalNoteRepository.save(new ApprovalNote(claim, finance, ApprovalAction.PAID, normalizeNote(note)));
        notificationService.notifyPaid(claim);
        auditLogService.record(
                finance.getEmail(),
                AuditAction.CLAIM_PAID,
                AuditResourceType.CLAIM,
                claim.getId(),
                finance.getName() + " marked claim " + claim.getTitle() + " as paid.",
                "{\"status\":\"" + claim.getStatus() + "\"}"
        );
        return toReviewResponse(claim);
    }

    private User resolveUser(String email, Role requiredRole) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is inactive");
        }

        if (user.getRole() != requiredRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid role");
        }

        return user;
    }

    private ExpenseClaim findClaim(Long id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private void validateManagerClaimAccess(User manager, ExpenseClaim claim) {
        Department department = claim.getEmployee().getDepartment();
        if (department == null || department.getManager() == null || !department.getManager().getId().equals(manager.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
        }
    }

    private ClaimStatus validateFinanceListStatus(ClaimStatus status) {
        if (!FINANCE_QUEUE_STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Finance review only supports manager or finance approved claims");
        }

        return status;
    }

    private ReviewClaimResponse toReviewResponse(ExpenseClaim claim) {
        List<AttachmentResponse> attachments = attachmentRepository.findByClaimIdOrderByUploadedAtDesc(claim.getId()).stream()
                .map(this::toAttachmentResponse)
                .toList();
        List<ApprovalNoteResponse> notes = approvalNoteRepository.findByClaimIdOrderByCreatedAtAsc(claim.getId()).stream()
                .map(this::toApprovalNoteResponse)
                .toList();
        Department department = claim.getEmployee().getDepartment();

        return new ReviewClaimResponse(
                claim.getId(),
                claim.getTitle(),
                claim.getDescription(),
                claim.getAmount(),
                claim.getTransactionDate(),
                claim.getStatus(),
                new ClaimCategoryResponse(claim.getCategory().getId(), claim.getCategory().getName()),
                new SimpleUserResponse(
                        claim.getEmployee().getId(),
                        claim.getEmployee().getName(),
                        claim.getEmployee().getEmail()
                ),
                department == null ? null : new SimpleDepartmentResponse(department.getId(), department.getName()),
                attachments,
                notes,
                claim.getSubmittedAt(),
                claim.getManagerReviewedAt(),
                claim.getFinanceReviewedAt(),
                claim.getPaidAt(),
                claim.getCreatedAt(),
                claim.getUpdatedAt()
        );
    }

    private AttachmentResponse toAttachmentResponse(ExpenseAttachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getClaim().getId(),
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize(),
                attachment.getUploadedAt()
        );
    }

    private ApprovalNoteResponse toApprovalNoteResponse(ApprovalNote note) {
        User reviewer = note.getReviewer();
        return new ApprovalNoteResponse(
                note.getId(),
                note.getAction(),
                note.getNote(),
                new ReviewUserResponse(reviewer.getId(), reviewer.getName(), reviewer.getEmail(), reviewer.getRole()),
                note.getCreatedAt()
        );
    }

    private String normalizeNote(String note) {
        return note == null || note.isBlank() ? null : note.trim();
    }
}
