package com.claimdesk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ClaimRequest(
        @NotBlank @Size(max = 160) String title,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull Long categoryId,
        @NotNull LocalDate transactionDate,
        @Size(max = 2000) String description
) {
}
