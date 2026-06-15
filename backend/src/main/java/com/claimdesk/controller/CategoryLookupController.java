package com.claimdesk.controller;

import com.claimdesk.dto.ActiveCategoryResponse;
import com.claimdesk.service.ExpenseCategoryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryLookupController {

    private final ExpenseCategoryService categoryService;

    public CategoryLookupController(ExpenseCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/active")
    public List<ActiveCategoryResponse> listActiveCategories() {
        return categoryService.listActiveCategories();
    }
}
