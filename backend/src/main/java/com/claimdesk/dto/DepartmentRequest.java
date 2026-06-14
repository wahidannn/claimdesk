package com.claimdesk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentRequest(
        @NotBlank @Size(max = 120) String name,
        Long managerId,
        boolean active
) {
}
