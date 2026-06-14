package com.claimdesk.controller;

import com.claimdesk.dto.ClaimRequest;
import com.claimdesk.dto.ClaimResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.service.ExpenseClaimService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/claims")
public class ExpenseClaimController {

    private final ExpenseClaimService claimService;

    public ExpenseClaimController(ExpenseClaimService claimService) {
        this.claimService = claimService;
    }

    @GetMapping
    public PagedResponse<ClaimResponse> listClaims(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return claimService.listClaims(
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

    @PostMapping
    public ClaimResponse createClaim(Principal principal, @Valid @RequestBody ClaimRequest request) {
        return claimService.createClaim(principal.getName(), request);
    }

    @GetMapping("/{id}")
    public ClaimResponse getClaim(Principal principal, @PathVariable Long id) {
        return claimService.getClaim(principal.getName(), id);
    }

    @PutMapping("/{id}")
    public ClaimResponse updateClaim(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody ClaimRequest request
    ) {
        return claimService.updateClaim(principal.getName(), id, request);
    }

    @PostMapping("/{id}/submit")
    public ClaimResponse submitClaim(Principal principal, @PathVariable Long id) {
        return claimService.submitClaim(principal.getName(), id);
    }

    @PostMapping("/{id}/cancel")
    public ClaimResponse cancelClaim(Principal principal, @PathVariable Long id) {
        return claimService.cancelClaim(principal.getName(), id);
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
