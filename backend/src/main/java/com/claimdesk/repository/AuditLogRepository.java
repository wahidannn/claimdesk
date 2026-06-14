package com.claimdesk.repository;

import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditLog;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Role;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("""
            select auditLog from AuditLog auditLog
            where (:search is null or :search = ''
                or lower(auditLog.description) like lower(concat('%', :search, '%'))
                or lower(auditLog.actorEmail) like lower(concat('%', :search, '%'))
                or lower(auditLog.metadata) like lower(concat('%', :search, '%')))
                and (:actorEmail is null or :actorEmail = '' or lower(auditLog.actorEmail) like lower(concat('%', :actorEmail, '%')))
                and (:actorRole is null or auditLog.actorRole = :actorRole)
                and (:action is null or auditLog.action = :action)
                and (:resourceType is null or auditLog.resourceType = :resourceType)
                and (:resourceId is null or auditLog.resourceId = :resourceId)
                and (:dateFrom is null or auditLog.createdAt >= :dateFrom)
                and (:dateTo is null or auditLog.createdAt < :dateTo)
            """)
    Page<AuditLog> search(
            String search,
            String actorEmail,
            Role actorRole,
            AuditAction action,
            AuditResourceType resourceType,
            Long resourceId,
            OffsetDateTime dateFrom,
            OffsetDateTime dateTo,
            Pageable pageable
    );

    @Query("select auditLog from AuditLog auditLog order by auditLog.createdAt desc")
    java.util.List<AuditLog> findRecent(Pageable pageable);
}
