package com.claimdesk.dto;

public record SimpleUserResponse(
        Long id,
        String name,
        String email
) {
}
