package com.claimdesk.controller;

import com.claimdesk.dto.AuditLogResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.Role;
import com.claimdesk.service.AuditLogService;
import java.security.Principal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    public AdminAuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public PagedResponse<AuditLogResponse> listAuditLogs(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String actorEmail,
            @RequestParam(required = false) Role actorRole,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditResourceType resourceType,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return auditLogService.listAuditLogs(
                search,
                actorEmail,
                actorRole,
                action,
                resourceType,
                resourceId,
                toStartOfDay(dateFrom),
                toExclusiveEnd(dateTo),
                Math.max(page, 0),
                normalizeSize(size)
        );
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportAuditLogs(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String actorEmail,
            @RequestParam(required = false) Role actorRole,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditResourceType resourceType,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        String csv = auditLogService.exportAuditLogs(
                principal.getName(),
                search,
                actorEmail,
                actorRole,
                action,
                resourceType,
                resourceId,
                toStartOfDay(dateFrom),
                toExclusiveEnd(dateTo)
        );

        String filename = "audit-logs-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(csv);
    }

    private OffsetDateTime toStartOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    private OffsetDateTime toExclusiveEnd(LocalDate date) {
        return date == null ? null : date.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
