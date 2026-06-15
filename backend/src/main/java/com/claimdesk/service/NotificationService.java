package com.claimdesk.service;

import com.claimdesk.config.CacheConfig;
import com.claimdesk.dto.NotificationResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.entity.ExpenseClaim;
import com.claimdesk.entity.Notification;
import com.claimdesk.entity.NotificationType;
import com.claimdesk.entity.Role;
import com.claimdesk.entity.User;
import com.claimdesk.repository.NotificationRepository;
import com.claimdesk.repository.UserRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> listNotifications(String email, int page, int size) {
        User user = resolveUser(email);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse));
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, key = "#email")
    public long countUnread(String email) {
        User user = resolveUser(email);
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public NotificationResponse markRead(String email, Long id) {
        User user = resolveUser(email);
        Notification notification = notificationRepository.findByIdAndRecipientId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.markRead();
        return toResponse(notification);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void markAllRead(String email) {
        User user = resolveUser(email);
        notificationRepository.findByRecipientIdAndReadFalse(user.getId())
                .forEach(Notification::markRead);
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyClaimSubmitted(ExpenseClaim claim) {
        User manager = claim.getEmployee().getDepartment() == null ? null : claim.getEmployee().getDepartment().getManager();
        if (manager == null || !manager.isActive()) {
            return;
        }

        createNotification(
                manager,
                NotificationType.CLAIM_SUBMITTED,
                "New claim submitted",
                claim.getEmployee().getName() + " submitted " + claim.getTitle() + ".",
                "/approvals/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyManagerApproved(ExpenseClaim claim) {
        createNotification(
                claim.getEmployee(),
                NotificationType.CLAIM_MANAGER_APPROVED,
                "Claim approved by manager",
                claim.getTitle() + " was approved by manager.",
                "/claims/" + claim.getId()
        );
        notifyFinanceUsers(
                NotificationType.CLAIM_MANAGER_APPROVED,
                "Claim ready for finance review",
                claim.getTitle() + " is ready for finance review.",
                "/finance-review/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyManagerRejected(ExpenseClaim claim) {
        createNotification(
                claim.getEmployee(),
                NotificationType.CLAIM_MANAGER_REJECTED,
                "Claim rejected by manager",
                claim.getTitle() + " was rejected by manager.",
                "/claims/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyRevisionRequested(ExpenseClaim claim) {
        createNotification(
                claim.getEmployee(),
                NotificationType.CLAIM_REVISION_REQUESTED,
                "Claim revision requested",
                claim.getTitle() + " needs revision.",
                "/claims/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyFinanceApproved(ExpenseClaim claim) {
        createNotification(
                claim.getEmployee(),
                NotificationType.CLAIM_FINANCE_APPROVED,
                "Claim approved by finance",
                claim.getTitle() + " was approved by finance.",
                "/claims/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyPaid(ExpenseClaim claim) {
        createNotification(
                claim.getEmployee(),
                NotificationType.CLAIM_PAID,
                "Claim paid",
                claim.getTitle() + " was marked as paid.",
                "/claims/" + claim.getId()
        );
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.NOTIFICATION_UNREAD_COUNT, allEntries = true)
    public void notifyClaimCommentCreated(ExpenseClaim claim, User author) {
        Map<Long, NotificationTarget> targets = new LinkedHashMap<>();
        addTarget(targets, claim.getEmployee(), "/claims/" + claim.getId());

        User manager = claim.getEmployee().getDepartment() == null ? null : claim.getEmployee().getDepartment().getManager();
        addTarget(targets, manager, "/approvals/" + claim.getId());

        if (claim.getStatus() == com.claimdesk.entity.ClaimStatus.MANAGER_APPROVED
                || claim.getStatus() == com.claimdesk.entity.ClaimStatus.FINANCE_APPROVED
                || claim.getStatus() == com.claimdesk.entity.ClaimStatus.PAID) {
            userRepository.findByRoleAndActiveTrue(Role.FINANCE)
                    .forEach(finance -> addTarget(targets, finance, "/finance-review/" + claim.getId()));
        }

        targets.values().stream()
                .filter(target -> !target.recipient().getId().equals(author.getId()))
                .forEach(target -> createNotification(
                        target.recipient(),
                        NotificationType.CLAIM_COMMENT_CREATED,
                        "New claim comment",
                        author.getName() + " commented on " + claim.getTitle() + ".",
                        target.link()
                ));
    }

    private void notifyFinanceUsers(NotificationType type, String title, String message, String link) {
        userRepository.findByRoleAndActiveTrue(Role.FINANCE)
                .forEach(finance -> createNotification(finance, type, title, message, link));
    }

    private void createNotification(User recipient, NotificationType type, String title, String message, String link) {
        if (recipient == null || !recipient.isActive()) {
            return;
        }

        notificationRepository.save(new Notification(recipient, type, title, message, link));
    }

    private void addTarget(Map<Long, NotificationTarget> targets, User recipient, String link) {
        if (recipient == null || !recipient.isActive()) {
            return;
        }

        targets.putIfAbsent(recipient.getId(), new NotificationTarget(recipient, link));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }

    private record NotificationTarget(User recipient, String link) {
    }
}
