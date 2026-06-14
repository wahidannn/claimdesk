package com.claimdesk.repository;

import com.claimdesk.entity.User;
import com.claimdesk.entity.Role;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findByRoleAndActiveTrue(Role role);

    long countByActiveTrue();

    long countByActiveFalse();

    @Query("""
            select user.role, count(user)
            from User user
            group by user.role
            """)
    List<Object[]> roleBreakdown();

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @Query("""
            select user from User user
            where (:search is null or :search = ''
                or lower(user.name) like lower(concat('%', :search, '%'))
                or lower(user.email) like lower(concat('%', :search, '%')))
                and (:role is null or user.role = :role)
                and (:active is null or user.active = :active)
            """)
    Page<User> search(String search, Role role, Boolean active, Pageable pageable);
}
