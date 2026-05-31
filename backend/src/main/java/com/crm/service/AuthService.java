package com.crm.service;
import com.crm.dto.AuthDto;
import com.crm.dto.LoginRequest;
import com.crm.entity.User;
import com.crm.exception.ApiException;
import com.crm.repository.UserRepository;
import com.crm.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (user.getRole() == null) {
            user.setRole(User.Role.USER);
        }
        
        User saved = userRepository.save(user);
        
        try {
            emailService.sendWelcomeEmail(saved.getEmail(), saved.getName());
        } catch (Exception e) {
            log.error("Failed to send welcome email", e);
        }
        
        log.info("User registered: {}", saved.getEmail());
        return buildAuthResponse(saved, jwtUtil.generateToken(saved));
    }
    
    public AuthDto.AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed, user not found for email: {}", request.getEmail());
                    return new ApiException("User not found", HttpStatus.UNAUTHORIZED);
                });

        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!passwordMatches) {
            log.warn("Login failed, invalid password for email: {}", request.getEmail());
            throw new ApiException("Invalid password", HttpStatus.UNAUTHORIZED);
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user, jwtUtil.generateToken(user));
    }
    
    private AuthDto.AuthResponse buildAuthResponse(User user, String token) {
        return AuthDto.AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
