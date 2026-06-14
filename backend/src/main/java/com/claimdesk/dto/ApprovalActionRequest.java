package com.claimdesk.dto;

import jakarta.validation.constraints.Size;

public record ApprovalActionRequest(
        @Size(max = 1000)
        String note
) {
}
