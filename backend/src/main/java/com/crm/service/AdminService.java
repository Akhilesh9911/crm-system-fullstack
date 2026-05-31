package com.crm.service;
import com.crm.dto.*;
import com.crm.entity.User;
import com.crm.exception.ApiException;
import com.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TaskRepository taskRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final ActivityRepository activityRepository;
    private final NotificationRepository notificationRepository;
    private final DealNoteRepository dealNoteRepository;
    
    public List<UserDto.Response> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public UserDto.Response createUser(AuthDto.RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User existingUser = userRepository.findByEmailIgnoreCase(email).orElse(null);
        User.Role targetRole = request.getRole() != null ? request.getRole() : User.Role.USER;

        if (targetRole == User.Role.ADMIN
                && (existingUser == null || existingUser.getRole() != User.Role.ADMIN)
                && userRepository.existsByRole(User.Role.ADMIN)) {
            throw new ApiException("Only one admin user is allowed", HttpStatus.CONFLICT);
        }

        User user = existingUser == null ? new User() : existingUser;
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(targetRole);
        
        User saved = userRepository.save(user);
        log.info("Admin created user: {}", saved.getEmail());
        return mapToResponse(saved);
    }
    
    @Transactional
    public UserDto.Response updateUserRole(Long id, User.Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (role == User.Role.ADMIN
                && user.getRole() != User.Role.ADMIN
                && userRepository.existsByRole(User.Role.ADMIN)) {
            throw new ApiException("Only one admin user is allowed", HttpStatus.CONFLICT);
        }

        user.setRole(role);
        User updated = userRepository.save(user);
        log.info("User role updated: {} to {}", user.getEmail(), role);
        return mapToResponse(updated);
    }
    
    @Transactional
    public void deleteUser(Long id, String currentUserEmail) {
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));
        
        if (targetUser.getEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new ApiException("Cannot delete your own account", HttpStatus.BAD_REQUEST);
        }
        
        taskRepository.findAll().forEach(task -> {
            if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(id)) {
                task.setAssignedTo(null);
                taskRepository.save(task);
            }
        });
        
        leadRepository.findAll().forEach(lead -> {
            if (lead.getAssignedTo() != null && lead.getAssignedTo().getId().equals(id)) {
                lead.setAssignedTo(null);
                leadRepository.save(lead);
            }
        });
        
        dealRepository.findAll().forEach(deal -> {
            if (deal.getAssignedTo() != null && deal.getAssignedTo().getId().equals(id)) {
                deal.setAssignedTo(null);
                dealRepository.save(deal);
            }
        });
        
        activityRepository.findAll().forEach(activity -> {
            if (activity.getCreatedBy() != null && activity.getCreatedBy().getId().equals(id)) {
                activityRepository.delete(activity);
            }
        });
        
        dealNoteRepository.findAll().forEach(note -> {
            if (note.getCreatedBy() != null && note.getCreatedBy().getId().equals(id)) {
                dealNoteRepository.delete(note);
            }
        });
        
        notificationRepository.findAll().forEach(notification -> {
            if (notification.getUser() != null && notification.getUser().getId().equals(id)) {
                notificationRepository.delete(notification);
            }
        });
        
        userRepository.delete(targetUser);
        log.info("User deleted: {}", targetUser.getEmail());
    }
    
    private UserDto.Response mapToResponse(User u) {
        return UserDto.Response.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
