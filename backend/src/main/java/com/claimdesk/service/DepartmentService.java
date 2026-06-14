package com.claimdesk.service;

import com.claimdesk.dto.DepartmentRequest;
import com.claimdesk.dto.DepartmentResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.SimpleUserResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Department;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.DepartmentRepository;
import com.claimdesk.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            AuditLogService auditLogService
    ) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<DepartmentResponse> listDepartments(String search, Boolean active, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(departmentRepository.search(search, active, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getDepartment(Long id) {
        return toResponse(findDepartment(id));
    }

    @Transactional
    public DepartmentResponse createDepartment(String actorEmail, DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists");
        }

        Department department = new Department(
                request.name().trim(),
                resolveManager(request.managerId()),
                request.active()
        );

        Department saved = departmentRepository.save(department);
        auditLogService.record(
                actorEmail,
                AuditAction.DEPARTMENT_CREATED,
                AuditResourceType.DEPARTMENT,
                saved.getId(),
                "Created department " + saved.getName() + ".",
                "{\"active\":" + saved.isActive() + "}"
        );
        return toResponse(saved);
    }

    @Transactional
    public DepartmentResponse updateDepartment(String actorEmail, Long id, DepartmentRequest request) {
        Department department = findDepartment(id);
        if (departmentRepository.existsByNameIgnoreCaseAndIdNot(request.name(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Department name already exists");
        }

        department.update(request.name().trim(), resolveManager(request.managerId()), request.active());
        auditLogService.record(
                actorEmail,
                AuditAction.DEPARTMENT_UPDATED,
                AuditResourceType.DEPARTMENT,
                department.getId(),
                "Updated department " + department.getName() + ".",
                "{\"active\":" + department.isActive() + "}"
        );
        return toResponse(department);
    }

    @Transactional
    public DepartmentResponse updateStatus(String actorEmail, Long id, boolean active) {
        Department department = findDepartment(id);
        department.setActive(active);
        auditLogService.record(
                actorEmail,
                AuditAction.DEPARTMENT_STATUS_CHANGED,
                AuditResourceType.DEPARTMENT,
                department.getId(),
                "Changed status for department " + department.getName() + ".",
                "{\"active\":" + department.isActive() + "}"
        );
        return toResponse(department);
    }

    private Department findDepartment(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    private User resolveManager(Long managerId) {
        if (managerId == null) {
            return null;
        }

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Manager not found"));

        if (manager.getRole() != Role.MANAGER || !manager.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department manager must be an active manager");
        }

        return manager;
    }

    private DepartmentResponse toResponse(Department department) {
        User manager = department.getManager();
        SimpleUserResponse managerResponse = manager == null
                ? null
                : new SimpleUserResponse(manager.getId(), manager.getName(), manager.getEmail());

        return new DepartmentResponse(
                department.getId(),
                department.getName(),
                department.isActive(),
                managerResponse,
                department.getCreatedAt(),
                department.getUpdatedAt()
        );
    }
}
