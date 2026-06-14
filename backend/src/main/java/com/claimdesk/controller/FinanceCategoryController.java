package com.claimdesk.controller;

import com.claimdesk.dto.CategoryRequest;
import com.claimdesk.dto.CategoryResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.dto.StatusRequest;
import com.claimdesk.service.ExpenseCategoryService;
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
@RequestMapping("/api/finance/categories")
public class FinanceCategoryController {

    private final ExpenseCategoryService categoryService;

    public FinanceCategoryController(ExpenseCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public PagedResponse<CategoryResponse> listCategories(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return categoryService.listCategories(search, active, Math.max(page, 0), normalizeSize(size));
    }

    @PostMapping
    public CategoryResponse createCategory(Principal principal, @Valid @RequestBody CategoryRequest request) {
        return categoryService.createCategory(principal.getName(), request);
    }

    @GetMapping("/{id}")
    public CategoryResponse getCategory(@PathVariable Long id) {
        return categoryService.getCategory(id);
    }

    @PutMapping("/{id}")
    public CategoryResponse updateCategory(Principal principal, @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(principal.getName(), id, request);
    }

    @PatchMapping("/{id}/status")
    public CategoryResponse updateStatus(Principal principal, @PathVariable Long id, @RequestBody StatusRequest request) {
        return categoryService.updateStatus(principal.getName(), id, request.active());
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
