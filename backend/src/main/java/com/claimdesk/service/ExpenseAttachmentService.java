package com.claimdesk.service;

import com.claimdesk.dto.AttachmentResponse;
import com.claimdesk.entity.AuditAction;
import com.claimdesk.entity.AuditResourceType;
import com.claimdesk.entity.ClaimStatus;
import com.claimdesk.entity.ExpenseAttachment;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.ExpenseAttachmentRepository;
import com.claimdesk.repository.ExpenseClaimRepository;
import com.claimdesk.repository.UserRepository;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.claimdesk.service.storage.LoadedReceipt;
import com.claimdesk.service.storage.ReceiptStorageService;
import com.claimdesk.service.storage.StoredReceipt;

@Service
public class ExpenseAttachmentService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".pdf");

    private final ExpenseAttachmentRepository attachmentRepository;
    private final ExpenseClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ReceiptStorageService receiptStorageService;
    private final long maxReceiptSizeBytes;

    public ExpenseAttachmentService(
            ExpenseAttachmentRepository attachmentRepository,
            ExpenseClaimRepository claimRepository,
            UserRepository userRepository,
            AuditLogService auditLogService,
            ReceiptStorageService receiptStorageService,
            @Value("${app.storage.max-receipt-size-bytes}") long maxReceiptSizeBytes
    ) {
        this.attachmentRepository = attachmentRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.receiptStorageService = receiptStorageService;
        this.maxReceiptSizeBytes = maxReceiptSizeBytes;
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listClaimAttachments(String email, Long claimId) {
        ExpenseClaim claim = resolveOwnedClaim(email, claimId);
        return attachmentRepository.findByClaimIdOrderByUploadedAtDesc(claim.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AttachmentResponse uploadAttachment(String email, Long claimId, MultipartFile file) {
        ExpenseClaim claim = resolveOwnedClaim(email, claimId);
        if (claim.getStatus() != ClaimStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments can only be uploaded to draft claims");
        }

        validateFile(file);
        String originalName = safeOriginalFileName(file);
        StoredReceipt storedReceipt = receiptStorageService.store(claim.getId(), originalName, file.getContentType(), file);

        ExpenseAttachment attachment = new ExpenseAttachment(
                claim,
                originalName,
                storedReceipt.objectKey(),
                file.getContentType(),
                file.getSize()
        );

        ExpenseAttachment saved;
        try {
            saved = attachmentRepository.save(attachment);
        } catch (RuntimeException exception) {
            receiptStorageService.delete(storedReceipt.objectKey());
            throw exception;
        }
        auditLogService.record(
                email,
                AuditAction.ATTACHMENT_UPLOADED,
                AuditResourceType.ATTACHMENT,
                saved.getId(),
                "Uploaded receipt " + saved.getFileName() + " for claim " + claim.getId() + ".",
                "{\"claimId\":" + claim.getId() + ",\"fileSize\":" + saved.getFileSize() + "}"
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AttachmentFile loadAttachmentFile(String email, Long attachmentId) {
        User user = resolveUser(email);
        ExpenseAttachment attachment = findAttachment(attachmentId);
        if (!canReadAttachment(user, attachment)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }

        return new AttachmentFile(
                attachment,
                receiptStorageService.load(attachment.getFilePath(), attachment.getFileType(), attachment.getFileName())
        );
    }

    @Transactional
    public void deleteAttachment(String email, Long attachmentId) {
        User user = resolveUser(email);
        ExpenseAttachment attachment = findAttachment(attachmentId);
        if (!isOwner(user, attachment.getClaim())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found");
        }

        if (attachment.getClaim().getStatus() != ClaimStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attachments can only be deleted from draft claims");
        }

        Long claimId = attachment.getClaim().getId();
        String fileName = attachment.getFileName();
        String objectKey = attachment.getFilePath();
        receiptStorageService.delete(objectKey);
        attachmentRepository.delete(attachment);
        auditLogService.record(
                email,
                AuditAction.ATTACHMENT_DELETED,
                AuditResourceType.ATTACHMENT,
                attachmentId,
                "Deleted receipt " + fileName + " from claim " + claimId + ".",
                "{\"claimId\":" + claimId + "}"
        );
    }

    private ExpenseClaim resolveOwnedClaim(String email, Long claimId) {
        User user = resolveUser(email);
        if (user.getRole() != Role.EMPLOYEE || !user.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only employees can manage claim attachments");
        }

        return claimRepository.findByIdAndEmployeeId(claimId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found"));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private ExpenseAttachment findAttachment(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
    }

    private boolean canReadAttachment(User user, ExpenseAttachment attachment) {
        return isOwner(user, attachment.getClaim())
                || user.getRole() == Role.ADMIN
                || user.getRole() == Role.MANAGER
                || user.getRole() == Role.FINANCE;
    }

    private boolean isOwner(User user, ExpenseClaim claim) {
        return claim.getEmployee().getId().equals(user.getId());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt file is required");
        }

        if (file.getSize() > maxReceiptSizeBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt file is too large");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt must be JPG, PNG, or PDF");
        }

        if (!ALLOWED_EXTENSIONS.contains(extensionOf(safeOriginalFileName(file)))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Receipt must be JPG, PNG, or PDF");
        }
    }

    private String safeOriginalFileName(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            return "receipt";
        }

        return Path.of(originalName).getFileName().toString();
    }

    private String extensionOf(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0) {
            return "";
        }

        return fileName.substring(dotIndex).toLowerCase(Locale.ROOT);
    }

    private AttachmentResponse toResponse(ExpenseAttachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getClaim().getId(),
                attachment.getFileName(),
                attachment.getFileType(),
                attachment.getFileSize(),
                attachment.getUploadedAt()
        );
    }

    public record AttachmentFile(ExpenseAttachment attachment, LoadedReceipt loadedReceipt) {
    }
}
