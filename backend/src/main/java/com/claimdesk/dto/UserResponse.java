package com.claimdesk.dto;

import com.claimdesk.entity.Role;
import java.time.OffsetDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        boolean active,
        SimpleDepartmentResponse department,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
