package com.crm.service;

import com.crm.entity.Notification;
import com.crm.entity.User;
import com.crm.repository.NotificationRepository;
import com.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void notifyAll(String message, String type) {
        try {
            List<User> users = userRepository.findAll();
            for (User user : users) {
                Notification notification = Notification.builder()
                        .user(user)
                        .message(message)
                        .type(type)
                        .read(false)
                        .build();
                notificationRepository.save(notification);
            }
        } catch (Exception e) {
            log.warn("Failed to create notification: {}", e.getMessage());
        }
    }

    public void notifyUser(User user, String message, String type) {
        try {
            Notification notification = Notification.builder()
                    .user(user)
                    .message(message)
                    .type(type)
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.warn("Failed to create notification for user {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
