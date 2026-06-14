package com.claimdesk.dto;

import com.claimdesk.entity.Role;

public record ReviewUserResponse(
        Long id,
        String name,
        String email,
        Role role
) {
}
