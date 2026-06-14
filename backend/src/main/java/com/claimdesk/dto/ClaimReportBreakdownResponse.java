package com.claimdesk.dto;

import java.math.BigDecimal;

public record ClaimReportBreakdownResponse(
        String label,
        long count,
        BigDecimal amount
) {
}
