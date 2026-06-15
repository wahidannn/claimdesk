package com.claimdesk.dto;

import java.time.OffsetDateTime;

public record ClaimCommentResponse(
        Long id,
        Long claimId,
        String message,
        ReviewUserResponse author,
        OffsetDateTime createdAt
) {
}
