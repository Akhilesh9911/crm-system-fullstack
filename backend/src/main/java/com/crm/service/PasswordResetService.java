package com.crm.service;
import com.crm.entity.PasswordResetToken;
import com.crm.entity.User;
import com.crm.exception.ApiException;
import com.crm.repository.PasswordResetTokenRepository;
import com.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {
    
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.password.reset.token.expiry}")
    private Long tokenExpiryMs;
    
    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.info("Password reset requested for non-existing email: {}", email);
            return;
        }
        
        tokenRepository.deleteByUser(user);
        
        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(tokenExpiryMs / 1000);
        
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .build();
        
        tokenRepository.save(resetToken);
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        } catch (Exception ex) {
            log.warn("Password reset email sending failed for {}. Token generated for testing: {}", email, token);
        }
        log.info("Password reset initiated for: {}", email);
    }
    
    @Transactional
    public void validateResetToken(String token) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new ApiException("Invalid or expired reset token", HttpStatus.BAD_REQUEST));
        
        if (resetToken.isExpired()) {
            throw new ApiException("Reset token has expired", HttpStatus.BAD_REQUEST);
        }
    }
    
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new ApiException("Invalid or expired reset token", HttpStatus.BAD_REQUEST));
        
        if (resetToken.isExpired() || resetToken.isUsed()) {
            throw new ApiException("Reset token has expired or been used", HttpStatus.BAD_REQUEST);
        }
        
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        log.info("Password reset successful for: {}", user.getEmail());
    }
}
