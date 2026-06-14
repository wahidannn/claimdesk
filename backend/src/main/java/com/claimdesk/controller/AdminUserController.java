package com.claimdesk.controller;

import com.claimdesk.dto.CreateUserRequest;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.StatusRequest;
import com.claimdesk.dto.UpdateUserRequest;
import com.claimdesk.dto.UserResponse;
import com.claimdesk.entity.Role;
import com.claimdesk.service.UserManagementService;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserManagementService userManagementService;

    public AdminUserController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public PagedResponse<UserResponse> listUsers(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return userManagementService.listUsers(search, role, active, Math.max(page, 0), normalizeSize(size));
    }

    @PostMapping
    public UserResponse createUser(Principal principal, @Valid @RequestBody CreateUserRequest request) {
        return userManagementService.createUser(principal.getName(), request);
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userManagementService.getUser(id);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(Principal principal, @PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        return userManagementService.updateUser(principal.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    public UserResponse updateStatus(Principal principal, @PathVariable Long id, @RequestBody StatusRequest request) {
        return userManagementService.updateStatus(principal.getName(), id, request.active());
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
