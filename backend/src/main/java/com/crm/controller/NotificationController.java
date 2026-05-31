package com.crm.controller;

import com.crm.entity.Notification;
import com.crm.entity.User;
import com.crm.repository.NotificationRepository;
import com.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            if (user == null) {
                return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
            }
            List<Map<String, Object>> data = notificationRepository.findByUserOrderByCreatedAtDesc(user)
                    .stream()
                    .map(this::toResponse)
                    .toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception e) {
            log.error("Error fetching notifications: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            if (user == null) {
                return ResponseEntity.ok(Map.of("success", true, "data", Map.of("count", 0)));
            }
            long count = notificationRepository.countByUserAndReadFalse(user);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of("count", count)));
        } catch (Exception e) {
            log.error("Error fetching unread count: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of("count", 0)));
        }
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }
            Optional<Notification> notifOpt = notificationRepository.findById(id);
            if (notifOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Notification not found"));
            }
            Notification notification = notifOpt.get();
            if (!notification.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Forbidden"));
            }
            notification.setRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
        } catch (Exception e) {
            log.error("Error marking notification read: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "message", "Done"));
        }
    }

    @PatchMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        try {
            User user = getAuthenticatedUser(authentication);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }
            List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
            notifications.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(notifications);
            return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
        } catch (Exception e) {
            log.error("Error marking all read: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true, "message", "Done"));
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private Map<String, Object> toResponse(Notification notification) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", notification.getId());
        map.put("message", notification.getMessage() != null ? notification.getMessage() : "");
        map.put("type", notification.getType() != null ? notification.getType() : "INFO");
        map.put("read", notification.isRead());
        map.put("createdAt", notification.getCreatedAt());
        return map;
    }
}