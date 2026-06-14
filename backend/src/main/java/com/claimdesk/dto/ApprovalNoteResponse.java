package com.claimdesk.dto;

import com.claimdesk.entity.ApprovalAction;
import java.time.OffsetDateTime;

public record ApprovalNoteResponse(
        Long id,
        ApprovalAction action,
        String note,
        ReviewUserResponse reviewer,
        OffsetDateTime createdAt
) {
}
