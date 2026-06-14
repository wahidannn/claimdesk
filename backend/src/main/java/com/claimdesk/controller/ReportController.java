package com.claimdesk.controller;

import com.claimdesk.dto.ClaimReportRowResponse;
import com.claimdesk.dto.ClaimReportSummaryResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.service.ReportService;
import java.security.Principal;
import java.time.LocalDate;
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
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/claims")
    public PagedResponse<ClaimReportRowResponse> listClaims(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return reportService.listClaims(
                principal.getName(),
                search,
                status,
                departmentId,
                employeeId,
                categoryId,
                dateFrom,
                dateTo,
                Math.max(page, 0),
                normalizeSize(size)
        );
    }

    @GetMapping("/claims/summary")
    public ClaimReportSummaryResponse summary(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        return reportService.getSummary(
                principal.getName(),
                search,
                status,
                departmentId,
                employeeId,
                categoryId,
                dateFrom,
                dateTo
        );
    }

    @GetMapping("/claims/export")
    public ResponseEntity<String> exportClaims(
            Principal principal,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        String csv = reportService.exportClaims(
                principal.getName(),
                search,
                status,
                departmentId,
                employeeId,
                categoryId,
                dateFrom,
                dateTo
        );
        return csvResponse(csv, "claim-report-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv");
    }

    private ResponseEntity<String> csvResponse(String csv, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(csv);
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }
}
