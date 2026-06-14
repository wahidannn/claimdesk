package com.claimdesk.dto;

import com.claimdesk.entity.NotificationType;
import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String link,
        boolean read,
        OffsetDateTime createdAt,
        OffsetDateTime readAt
) {
}
