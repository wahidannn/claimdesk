package com.claimdesk.service;

import com.claimdesk.dto.AuditLogResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditLog;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.AuditLogRepository;
import com.claimdesk.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final CsvExportService csvExportService;

    public AuditLogService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            CsvExportService csvExportService
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.csvExportService = csvExportService;
    }

    @Transactional
    public String exportAuditLogs(
            String actorEmail,
            String search,
            String targetActorEmail,
            Role actorRole,
            AuditAction action,
            AuditResourceType resourceType,
            Long resourceId,
            OffsetDateTime dateFrom,
            OffsetDateTime dateTo
    ) {
        List<AuditLog> auditLogs = auditLogRepository.search(
                search,
                targetActorEmail,
                actorRole,
                action,
                resourceType,
                resourceId,
                dateFrom,
                dateTo,
                Pageable.unpaged()
        ).getContent();

        record(
                actorEmail,
                AuditAction.AUDIT_LOG_EXPORTED,
                AuditResourceType.AUTH,
                null,
                actorEmail + " exported audit logs.",
                "{\"rows\":" + auditLogs.size() + "}"
        );

        return csvExportService.toCsv(
                List.of(
                        "ID",
                        "Actor ID",
                        "Actor Email",
                        "Actor Role",
                        "Action",
                        "Resource Type",
                        "Resource ID",
                        "Description",
                        "Metadata",
                        "Created At"
                ),
                auditLogs.stream().map(auditLog -> List.of(
                        string(auditLog.getId()),
                        string(auditLog.getActorId()),
                        string(auditLog.getActorEmail()),
                        string(auditLog.getActorRole()),
                        auditLog.getAction().name(),
                        auditLog.getResourceType().name(),
                        string(auditLog.getResourceId()),
                        auditLog.getDescription(),
                        string(auditLog.getMetadata()),
                        string(auditLog.getCreatedAt())
                )).toList()
        );
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogResponse> listAuditLogs(
            String search,
            String actorEmail,
            Role actorRole,
            AuditAction action,
            AuditResourceType resourceType,
            Long resourceId,
            OffsetDateTime dateFrom,
            OffsetDateTime dateTo,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(auditLogRepository
                .search(search, actorEmail, actorRole, action, resourceType, resourceId, dateFrom, dateTo, pageable)
                .map(this::toResponse));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actorEmail, AuditAction action, AuditResourceType resourceType, Long resourceId, String description) {
        record(actorEmail, action, resourceType, resourceId, description, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            String actorEmail,
            AuditAction action,
            AuditResourceType resourceType,
            Long resourceId,
            String description,
            String metadata
    ) {
        User actor = actorEmail == null ? null : userRepository.findByEmailIgnoreCase(actorEmail).orElse(null);
        AuditLog auditLog = new AuditLog(
                actor == null ? null : actor.getId(),
                actorEmail,
                actor == null ? null : actor.getRole(),
                action,
                resourceType,
                resourceId,
                description,
                metadata
        );
        auditLogRepository.save(auditLog);
    }

    private AuditLogResponse toResponse(AuditLog auditLog) {
        return new AuditLogResponse(
                auditLog.getId(),
                auditLog.getActorId(),
                auditLog.getActorEmail(),
                auditLog.getActorRole(),
                auditLog.getAction(),
                auditLog.getResourceType(),
                auditLog.getResourceId(),
                auditLog.getDescription(),
                auditLog.getMetadata(),
                auditLog.getCreatedAt()
        );
    }

    private String string(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
