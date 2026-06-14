package com.claimdesk.dto;

import java.time.OffsetDateTime;

public record AttachmentResponse(
        Long id,
        Long claimId,
        String fileName,
        String fileType,
        long fileSize,
        OffsetDateTime uploadedAt
) {
}
