package com.claimdesk.controller;

import com.claimdesk.dto.DepartmentRequest;
import com.claimdesk.dto.DepartmentResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.StatusRequest;
import com.claimdesk.service.DepartmentService;
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
@RequestMapping("/api/admin/departments")
public class AdminDepartmentController {

    private final DepartmentService departmentService;

    public AdminDepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public PagedResponse<DepartmentResponse> listDepartments(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return departmentService.listDepartments(search, active, Math.max(page, 0), normalizeSize(size));
    }

    @PostMapping
    public DepartmentResponse createDepartment(Principal principal, @Valid @RequestBody DepartmentRequest request) {
        return departmentService.createDepartment(principal.getName(), request);
    }

    @GetMapping("/{id}")
    public DepartmentResponse getDepartment(@PathVariable Long id) {
        return departmentService.getDepartment(id);
    }

    @PutMapping("/{id}")
    public DepartmentResponse updateDepartment(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request
    ) {
        return departmentService.updateDepartment(principal.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    public DepartmentResponse updateStatus(Principal principal, @PathVariable Long id, @RequestBody StatusRequest request) {
        return departmentService.updateStatus(principal.getName(), id, request.active());
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
