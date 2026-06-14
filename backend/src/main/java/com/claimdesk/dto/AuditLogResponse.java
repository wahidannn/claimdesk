package com.claimdesk.dto;

import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Role;
import java.time.OffsetDateTime;

public record AuditLogResponse(
        Long id,
        Long actorId,
        String actorEmail,
        Role actorRole,
        AuditAction action,
        AuditResourceType resourceType,
        Long resourceId,
        String description,
        String metadata,
        OffsetDateTime createdAt
) {
}
