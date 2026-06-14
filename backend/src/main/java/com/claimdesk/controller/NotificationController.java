package com.claimdesk.controller;

import com.claimdesk.dto.CountResponse;
import com.claimdesk.dto.NotificationResponse;
import com.claimdesk.dto.PagedResponse;
import com.claimdesk.service.NotificationService;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public PagedResponse<NotificationResponse> listNotifications(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return notificationService.listNotifications(principal.getName(), Math.max(page, 0), normalizeSize(size));
    }

    @GetMapping("/unread-count")
    public CountResponse unreadCount(Principal principal) {
        return new CountResponse(notificationService.countUnread(principal.getName()));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(Principal principal, @PathVariable Long id) {
        return notificationService.markRead(principal.getName(), id);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Principal principal) {
        notificationService.markAllRead(principal.getName());
        return ResponseEntity.noContent().build();
    }

    private int normalizeSize(int size) {
        return Math.min(Math.max(size, 1), 50);
    }
}
