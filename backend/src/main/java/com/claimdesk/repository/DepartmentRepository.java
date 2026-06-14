package com.claimdesk.repository;

import com.claimdesk.entity.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    long countByActiveTrue();

    long countByActiveFalse();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("""
            select department from Department department
            where (:search is null or :search = ''
                or lower(department.name) like lower(concat('%', :search, '%')))
                and (:active is null or department.active = :active)
            """)
    Page<Department> search(String search, Boolean active, Pageable pageable);
}
