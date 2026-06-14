package com.claimdesk.dto;

import java.math.BigDecimal;

public record DashboardBreakdownResponse(
        String label,
        Long count,
        BigDecimal amount
) {
}
