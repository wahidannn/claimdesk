package com.claimdesk.repository;

import com.claimdesk.entity.ExpenseCategory;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {

    long countByActiveTrue();

    long countByActiveFalse();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<ExpenseCategory> findByActiveTrueOrderByNameAsc();

    @Query("""
            select category from ExpenseCategory category
            where (:search is null or :search = ''
                or lower(category.name) like lower(concat('%', :search, '%'))
                or lower(category.description) like lower(concat('%', :search, '%')))
                and (:active is null or category.active = :active)
            """)
    Page<ExpenseCategory> search(String search, Boolean active, Pageable pageable);
}
