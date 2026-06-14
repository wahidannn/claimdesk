package com.claimdesk.dto;

import java.time.OffsetDateTime;

public record DepartmentResponse(
        Long id,
        String name,
        boolean active,
        SimpleUserResponse manager,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
