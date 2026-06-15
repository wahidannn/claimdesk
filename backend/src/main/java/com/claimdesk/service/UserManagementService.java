package com.claimdesk.service;

import com.claimdesk.config.CacheConfig;
import com.claimdesk.dto.CreateUserRequest;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.SimpleDepartmentResponse;
import com.claimdesk.dto.UpdateUserRequest;
import com.claimdesk.dto.UserResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Department;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.DepartmentRepository;
import com.claimdesk.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    public UserManagementService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> listUsers(String search, Role role, Boolean active, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(userRepository.search(search, role, active, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long id) {
        return toResponse(findUser(id));
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.ADMIN_DASHBOARD,
                    CacheConfig.MANAGER_DASHBOARD,
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public UserResponse createUser(String actorEmail, CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        Department department = resolveDepartment(request.role(), request.departmentId());
        User user = new User(
                request.name().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.role(),
                request.active(),
                department
        );

        User saved = userRepository.save(user);
        auditLogService.record(
                actorEmail,
                AuditAction.USER_CREATED,
                AuditResourceType.USER,
                saved.getId(),
                "Created user " + saved.getEmail() + ".",
                "{\"role\":\"" + saved.getRole() + "\",\"active\":" + saved.isActive() + "}"
        );
        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.ADMIN_DASHBOARD,
                    CacheConfig.MANAGER_DASHBOARD,
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public UserResponse updateUser(String actorEmail, Long id, UpdateUserRequest request) {
        User user = findUser(id);
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(request.email(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        Department department = resolveDepartment(request.role(), request.departmentId());
        user.update(
                request.name().trim(),
                request.email().trim().toLowerCase(),
                request.role(),
                request.active(),
                department
        );

        if (request.password() != null && !request.password().isBlank()) {
            user.updatePassword(passwordEncoder.encode(request.password()));
        }

        auditLogService.record(
                actorEmail,
                AuditAction.USER_UPDATED,
                AuditResourceType.USER,
                user.getId(),
                "Updated user " + user.getEmail() + ".",
                "{\"role\":\"" + user.getRole() + "\",\"active\":" + user.isActive() + "}"
        );
        return toResponse(user);
    }

    @Transactional
    @CacheEvict(
            cacheNames = {
                    CacheConfig.ADMIN_DASHBOARD,
                    CacheConfig.MANAGER_DASHBOARD,
                    CacheConfig.FINANCE_DASHBOARD,
                    CacheConfig.CLAIM_REPORT_SUMMARY
            },
            allEntries = true
    )
    public UserResponse updateStatus(String actorEmail, Long id, boolean active) {
        User user = findUser(id);
        user.setActive(active);
        auditLogService.record(
                actorEmail,
                AuditAction.USER_STATUS_CHANGED,
                AuditResourceType.USER,
                user.getId(),
                "Changed status for user " + user.getEmail() + ".",
                "{\"active\":" + user.isActive() + "}"
        );
        return toResponse(user);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Department resolveDepartment(Role role, Long departmentId) {
        if ((role == Role.EMPLOYEE || role == Role.MANAGER) && departmentId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department is required for employee and manager");
        }

        if (departmentId == null) {
            return null;
        }

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        if (!department.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department must be active");
        }

        return department;
    }

    private UserResponse toResponse(User user) {
        Department department = user.getDepartment();
        SimpleDepartmentResponse departmentResponse = department == null
                ? null
                : new SimpleDepartmentResponse(department.getId(), department.getName());

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                departmentResponse,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
