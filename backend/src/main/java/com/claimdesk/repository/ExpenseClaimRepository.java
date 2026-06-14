package com.claimdesk.repository;

import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.ExpenseClaim;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, Long> {

    Optional<ExpenseClaim> findByIdAndEmployeeId(Long id, Long employeeId);

    long countByEmployeeIdAndStatus(Long employeeId, ClaimStatus status);

    long countByStatus(ClaimStatus status);

    @Query("select count(claim) from ExpenseClaim claim join claim.employee employee join employee.department department where department.manager.id = :managerId and claim.status = :status")
    long countManagerClaimsByStatus(Long managerId, ClaimStatus status);

    @Query("select coalesce(sum(claim.amount), 0) from ExpenseClaim claim where claim.employee.id = :employeeId")
    BigDecimal sumAmountByEmployeeId(Long employeeId);

    @Query("select coalesce(sum(claim.amount), 0) from ExpenseClaim claim where claim.employee.id = :employeeId and claim.status = :status")
    BigDecimal sumAmountByEmployeeIdAndStatus(Long employeeId, ClaimStatus status);

    @Query("select coalesce(sum(claim.amount), 0) from ExpenseClaim claim where claim.employee.id = :employeeId and claim.status not in :statuses")
    BigDecimal sumAmountByEmployeeIdAndStatusNotIn(Long employeeId, Collection<ClaimStatus> statuses);

    @Query("select coalesce(sum(claim.amount), 0) from ExpenseClaim claim where claim.status = :status")
    BigDecimal sumAmountByStatus(ClaimStatus status);

    @Query("""
            select claim.status, count(claim), coalesce(sum(claim.amount), 0)
            from ExpenseClaim claim
            where claim.employee.id = :employeeId
            group by claim.status
            """)
    List<Object[]> employeeStatusBreakdown(Long employeeId);

    @Query("""
            select claim.category.name, count(claim), coalesce(sum(claim.amount), 0)
            from ExpenseClaim claim
            where claim.employee.id = :employeeId
            group by claim.category.name
            order by coalesce(sum(claim.amount), 0) desc
            """)
    List<Object[]> employeeCategoryBreakdown(Long employeeId);

    @Query("select claim from ExpenseClaim claim where claim.employee.id = :employeeId and claim.transactionDate >= :date")
    List<ExpenseClaim> findEmployeeClaimsSince(Long employeeId, LocalDate date);

    @Query("select claim from ExpenseClaim claim where claim.employee.id = :employeeId order by claim.updatedAt desc")
    List<ExpenseClaim> findRecentEmployeeClaims(Long employeeId, Pageable pageable);

    @Query("""
            select claim from ExpenseClaim claim
            where claim.employee.id = :employeeId
                and (:search is null or :search = ''
                    or lower(claim.title) like lower(concat('%', :search, '%'))
                    or lower(claim.description) like lower(concat('%', :search, '%')))
                and (:status is null or claim.status = :status)
                and (:categoryId is null or claim.category.id = :categoryId)
                and (:dateFrom is null or claim.transactionDate >= :dateFrom)
                and (:dateTo is null or claim.transactionDate <= :dateTo)
            """)
    Page<ExpenseClaim> searchEmployeeClaims(
            Long employeeId,
            String search,
            ClaimStatus status,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable
    );

    @Query("""
            select claim from ExpenseClaim claim
            join claim.employee employee
            join employee.department department
            where department.manager.id = :managerId
                and (:search is null or :search = ''
                    or lower(claim.title) like lower(concat('%', :search, '%'))
                    or lower(claim.description) like lower(concat('%', :search, '%'))
                    or lower(employee.name) like lower(concat('%', :search, '%')))
                and (:status is null or claim.status = :status)
                and (:categoryId is null or claim.category.id = :categoryId)
                and (:dateFrom is null or claim.transactionDate >= :dateFrom)
                and (:dateTo is null or claim.transactionDate <= :dateTo)
            """)
    Page<ExpenseClaim> searchManagerClaims(
            Long managerId,
            String search,
            ClaimStatus status,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable
    );

    @Query("""
            select claim from ExpenseClaim claim
            join claim.employee employee
            left join employee.department department
            where claim.status in :statuses
                and (:search is null or :search = ''
                    or lower(claim.title) like lower(concat('%', :search, '%'))
                    or lower(claim.description) like lower(concat('%', :search, '%'))
                    or lower(employee.name) like lower(concat('%', :search, '%'))
                    or lower(department.name) like lower(concat('%', :search, '%')))
                and (:categoryId is null or claim.category.id = :categoryId)
                and (:dateFrom is null or claim.transactionDate >= :dateFrom)
                and (:dateTo is null or claim.transactionDate <= :dateTo)
            """)
    Page<ExpenseClaim> searchFinanceClaims(
            Collection<ClaimStatus> statuses,
            String search,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable
    );

    @Query("""
            select claim from ExpenseClaim claim
            join claim.employee employee
            left join employee.department department
            join claim.category category
            where (:employeeScopeId is null or employee.id = :employeeScopeId)
                and (:managerScopeId is null or department.manager.id = :managerScopeId)
                and (:search is null or :search = ''
                    or lower(claim.title) like lower(concat('%', :search, '%'))
                    or lower(claim.description) like lower(concat('%', :search, '%'))
                    or lower(employee.name) like lower(concat('%', :search, '%'))
                    or lower(employee.email) like lower(concat('%', :search, '%'))
                    or lower(department.name) like lower(concat('%', :search, '%'))
                    or lower(category.name) like lower(concat('%', :search, '%')))
                and (:status is null or claim.status = :status)
                and (:departmentId is null or department.id = :departmentId)
                and (:employeeId is null or employee.id = :employeeId)
                and (:categoryId is null or category.id = :categoryId)
                and (:dateFrom is null or claim.transactionDate >= :dateFrom)
                and (:dateTo is null or claim.transactionDate <= :dateTo)
            """)
    Page<ExpenseClaim> searchReportClaims(
            Long employeeScopeId,
            Long managerScopeId,
            String search,
            ClaimStatus status,
            Long departmentId,
            Long employeeId,
            Long categoryId,
            LocalDate dateFrom,
            LocalDate dateTo,
            Pageable pageable
    );
}
