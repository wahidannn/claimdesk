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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

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
            @RequestParam(defaultValue = "") String actorRole,
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String resourceType,
            @RequestParam(defaultValue = "") String resourceId,
            @RequestParam(defaultValue = "") String dateFrom,
            @RequestParam(defaultValue = "") String dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return auditLogService.listAuditLogs(
                search,
                actorEmail,
                parseEnum(actorRole, Role.class, "actorRole"),
                parseEnum(action, AuditAction.class, "action"),
                parseEnum(resourceType, AuditResourceType.class, "resourceType"),
                parseLong(resourceId, "resourceId"),
                toStartOfDay(parseDate(dateFrom, "dateFrom")),
                toExclusiveEnd(parseDate(dateTo, "dateTo")),
                Math.max(page, 0),
                normalizeSize(size)
        );
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportAuditLogs(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String actorEmail,
            @RequestParam(defaultValue = "") String actorRole,
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "") String resourceType,
            @RequestParam(defaultValue = "") String resourceId,
            @RequestParam(defaultValue = "") String dateFrom,
            @RequestParam(defaultValue = "") String dateTo
    ) {
        String csv = auditLogService.exportAuditLogs(
                principal.getName(),
                search,
                actorEmail,
                parseEnum(actorRole, Role.class, "actorRole"),
                parseEnum(action, AuditAction.class, "action"),
                parseEnum(resourceType, AuditResourceType.class, "resourceType"),
                parseLong(resourceId, "resourceId"),
                toStartOfDay(parseDate(dateFrom, "dateFrom")),
                toExclusiveEnd(parseDate(dateTo, "dateTo"))
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

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Enum.valueOf(enumType, value);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName);
        }
    }

    private Long parseLong(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return Long.valueOf(value);
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName);
        }
    }

    private LocalDate parseDate(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid " + fieldName);
        }
    }
}
