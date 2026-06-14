package com.claimdesk.controller;

import com.claimdesk.dto.AttachmentResponse;
import com.claimdesk.service.ExpenseAttachmentService;
import com.claimdesk.service.storage.LoadedReceipt;
import jakarta.validation.constraints.NotNull;
import java.security.Principal;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
public class ClaimAttachmentController {

    private final ExpenseAttachmentService attachmentService;

    public ClaimAttachmentController(ExpenseAttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @GetMapping("/api/claims/{claimId}/attachments")
    public List<AttachmentResponse> listClaimAttachments(Principal principal, @PathVariable Long claimId) {
        return attachmentService.listClaimAttachments(principal.getName(), claimId);
    }

    @PostMapping(value = "/api/claims/{claimId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AttachmentResponse uploadAttachment(
            Principal principal,
            @PathVariable Long claimId,
            @NotNull @RequestPart("file") MultipartFile file
    ) {
        return attachmentService.uploadAttachment(principal.getName(), claimId, file);
    }

    @GetMapping("/api/attachments/{id}")
    public ResponseEntity<?> getAttachment(Principal principal, @PathVariable Long id) {
        ExpenseAttachmentService.AttachmentFile attachmentFile = attachmentService.loadAttachmentFile(
                principal.getName(),
                id
        );
        LoadedReceipt loadedReceipt = attachmentFile.loadedReceipt();

        if (loadedReceipt.isRedirect()) {
            return ResponseEntity.status(302)
                    .location(loadedReceipt.redirectUri())
                    .build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachmentFile.attachment().getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(attachmentFile.attachment().getFileName())
                        .build()
                        .toString())
                .body(loadedReceipt.resource());
    }

    @DeleteMapping("/api/attachments/{id}")
    public ResponseEntity<Void> deleteAttachment(Principal principal, @PathVariable Long id) {
        attachmentService.deleteAttachment(principal.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
