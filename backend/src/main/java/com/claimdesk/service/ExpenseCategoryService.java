package com.claimdesk.service;

import com.claimdesk.dto.CategoryRequest;
import com.claimdesk.dto.CategoryResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ExpenseCategory;
import com.claimdesk.repository.ExpenseCategoryRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public ExpenseCategoryService(ExpenseCategoryRepository categoryRepository, AuditLogService auditLogService) {
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<CategoryResponse> listCategories(String search, Boolean active, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(categoryRepository.search(search, active, pageable).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id) {
        return toResponse(findCategory(id));
    }

    @Transactional
    public CategoryResponse createCategory(String actorEmail, CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }

        ExpenseCategory category = new ExpenseCategory(
                request.name().trim(),
                normalizeDescription(request.description()),
                request.active()
        );

        ExpenseCategory saved = categoryRepository.save(category);
        auditLogService.record(
                actorEmail,
                AuditAction.CATEGORY_CREATED,
                AuditResourceType.CATEGORY,
                saved.getId(),
                "Created category " + saved.getName() + ".",
                "{\"active\":" + saved.isActive() + "}"
        );
        return toResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(String actorEmail, Long id, CategoryRequest request) {
        ExpenseCategory category = findCategory(id);
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(request.name(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }

        category.update(request.name().trim(), normalizeDescription(request.description()), request.active());
        auditLogService.record(
                actorEmail,
                AuditAction.CATEGORY_UPDATED,
                AuditResourceType.CATEGORY,
                category.getId(),
                "Updated category " + category.getName() + ".",
                "{\"active\":" + category.isActive() + "}"
        );
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse updateStatus(String actorEmail, Long id, boolean active) {
        ExpenseCategory category = findCategory(id);
        category.setActive(active);
        auditLogService.record(
                actorEmail,
                AuditAction.CATEGORY_STATUS_CHANGED,
                AuditResourceType.CATEGORY,
                category.getId(),
                "Changed status for category " + category.getName() + ".",
                "{\"active\":" + category.isActive() + "}"
        );
        return toResponse(category);
    }

    private ExpenseCategory findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private CategoryResponse toResponse(ExpenseCategory category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
