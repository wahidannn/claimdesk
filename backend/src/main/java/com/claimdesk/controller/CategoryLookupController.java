package com.claimdesk.controller;

import com.claimdesk.dto.ActiveCategoryResponse;
import com.claimdesk.repository.ExpenseCategoryRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryLookupController {

    private final ExpenseCategoryRepository categoryRepository;

    public CategoryLookupController(ExpenseCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @GetMapping("/active")
    public List<ActiveCategoryResponse> listActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(category -> new ActiveCategoryResponse(
                        category.getId(),
                        category.getName(),
                        category.getDescription()
                ))
                .toList();
    }
}
