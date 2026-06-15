package com.claimdesk.controller;

import com.claimdesk.dto.ClaimCommentRequest;
import com.claimdesk.dto.ClaimCommentResponse;
import com.claimdesk.service.ClaimCommentService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/claims/{claimId}/comments")
public class ClaimCommentController {

    private final ClaimCommentService commentService;

    public ClaimCommentController(ClaimCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<ClaimCommentResponse> listComments(Principal principal, @PathVariable Long claimId) {
        return commentService.listComments(principal.getName(), claimId);
    }

    @PostMapping
    public ClaimCommentResponse createComment(
            Principal principal,
            @PathVariable Long claimId,
            @Valid @RequestBody ClaimCommentRequest request
    ) {
        return commentService.createComment(principal.getName(), claimId, request);
    }
}
