package com.crm.service;

import com.crm.entity.Activity;
import com.crm.entity.User;
import com.crm.repository.ActivityRepository;
import com.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public void log(String type, String description, String entityType, Long entityId) {
        try {
            User currentUser = getCurrentUser();
            Activity activity = Activity.builder()
                    .type(type)
                    .description(description)
                    .entityType(entityType)
                    .entityId(entityId)
                    .createdBy(currentUser)
                    .build();
            activityRepository.save(activity);
        } catch (Exception e) {
            log.warn("Failed to log activity: {}", e.getMessage());
        }
    }

    public void logAsSystem(String type, String description, String entityType, Long entityId) {
        try {
            Activity activity = Activity.builder()
                    .type(type)
                    .description(description)
                    .entityType(entityType)
                    .entityId(entityId)
                    .createdBy(null)
                    .build();
            activityRepository.save(activity);
        } catch (Exception e) {
            log.warn("Failed to log system activity: {}", e.getMessage());
        }
    }

    private User getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) return null;
            return userRepository.findByEmail(auth.getName()).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
