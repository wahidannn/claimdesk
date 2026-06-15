package com.claimdesk.service;

import com.claimdesk.dto.ClaimCommentRequest;
import com.claimdesk.dto.ClaimCommentResponse;
import com.claimdesk.dto.ReviewUserResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ClaimComment;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.Department;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.ClaimCommentRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClaimCommentService {

    private static final Set<ClaimStatus> FINANCE_COMMENT_STATUSES = Set.of(
            ClaimStatus.MANAGER_APPROVED,
            ClaimStatus.FINANCE_APPROVED,
            ClaimStatus.PAID
    );

    private final ClaimCommentRepository commentRepository;
    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public ClaimCommentService(
            ClaimCommentRepository commentRepository,
            ExpenseClaimRepository claimRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            AuditLogService auditLogService
    ) {
        this.commentRepository = commentRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ClaimCommentResponse> listComments(String email, Long claimId) {
        User actor = resolveUser(email);
        ExpenseClaim claim = findClaim(claimId);
        validateAccess(actor, claim);

        return commentRepository.findByClaimIdOrderByCreatedAtAsc(claim.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClaimCommentResponse createComment(String email, Long claimId, ClaimCommentRequest request) {
        User actor = resolveUser(email);
        ExpenseClaim claim = findClaim(claimId);
        validateAccess(actor, claim);

        String message = normalizeMessage(request.message());
        ClaimComment saved = commentRepository.save(new ClaimComment(claim, actor, message));
        auditLogService.record(
                actor.getEmail(),
                AuditAction.CLAIM_COMMENT_CREATED,
                AuditResourceType.CLAIM,
                claim.getId(),
                actor.getName() + " commented on claim " + claim.getTitle() + ".",
                "{\"commentId\":" + saved.getId() + "}"
        );
        notificationService.notifyClaimCommentCreated(claim, actor);
        return toResponse(saved);
    }

    private User resolveUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!user.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is inactive");
        }

        return user;
    }

    private ExpenseClaim findClaim(Long claimId) {
        return claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private void validateAccess(User actor, ExpenseClaim claim) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        if (actor.getRole() == Role.EMPLOYEE && claim.getEmployee().getId().equals(actor.getId())) {
            return;
        }

        if (actor.getRole() == Role.MANAGER && isDepartmentManager(actor, claim)) {
            return;
        }

        if (actor.getRole() == Role.FINANCE && FINANCE_COMMENT_STATUSES.contains(claim.getStatus())) {
            return;
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found");
    }

    private boolean isDepartmentManager(User actor, ExpenseClaim claim) {
        Department department = claim.getEmployee().getDepartment();
        return department != null
                && department.getManager() != null
                && department.getManager().getId().equals(actor.getId());
    }

    private String normalizeMessage(String message) {
        String normalized = message == null ? "" : message.trim();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message is required");
        }

        if (normalized.length() > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment message must be at most 2000 characters");
        }

        return normalized;
    }

    private ClaimCommentResponse toResponse(ClaimComment comment) {
        User author = comment.getAuthor();
        return new ClaimCommentResponse(
                comment.getId(),
                comment.getClaim().getId(),
                comment.getMessage(),
                new ReviewUserResponse(author.getId(), author.getName(), author.getEmail(), author.getRole()),
                comment.getCreatedAt()
        );
    }
}
