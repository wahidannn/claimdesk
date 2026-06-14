package com.claimdesk.controller;

import com.claimdesk.dto.ApprovalActionRequest;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.ReviewClaimResponse;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.service.ApprovalWorkflowService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager/claims")
public class ManagerClaimController {

    private final ApprovalWorkflowService approvalWorkflowService;

    public ManagerClaimController(ApprovalWorkflowService approvalWorkflowService) {
        this.approvalWorkflowService = approvalWorkflowService;
    }

    @GetMapping
    public PagedResponse<ReviewClaimResponse> listClaims(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return approvalWorkflowService.listManagerClaims(
                principal.getName(),
                search,
                status,
                categoryId,
                dateFrom,
                dateTo,
                Math.max(page, 0),
                normalizeSize(size)
        );
    }

    @GetMapping("/{id}")
    public ReviewClaimResponse getClaim(Principal principal, @PathVariable Long id) {
        return approvalWorkflowService.getManagerClaim(principal.getName(), id);
    }

    @PostMapping("/{id}/approve")
    public ReviewClaimResponse approve(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) ApprovalActionRequest request
    ) {
        return approvalWorkflowService.managerApprove(principal.getName(), id, request == null ? null : request.note());
    }

    @PostMapping("/{id}/reject")
    public ReviewClaimResponse reject(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionRequest request
    ) {
        return approvalWorkflowService.managerReject(principal.getName(), id, request.note());
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
