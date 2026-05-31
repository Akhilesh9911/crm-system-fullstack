package com.crm.config;

import com.crm.entity.User;
import com.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private static final String ADMIN_NAME = "System Admin";
    private static final String ADMIN_EMAIL = "admin@crm.com";
    private static final String ADMIN_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User existingAdmin = userRepository.findByEmail(ADMIN_EMAIL).orElse(null);
        if (existingAdmin != null) {
            if (isMalformedBcrypt(existingAdmin.getPassword())) {
                existingAdmin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
                userRepository.save(existingAdmin);
                log.warn("Repaired malformed password hash for admin: {}", ADMIN_EMAIL);
            } else {
                log.info("Admin user already exists. Skipping admin seed.");
            }
            return;
        }

        if (userRepository.existsByRole(User.Role.ADMIN)) {
            log.info("An admin user already exists with a different email. Skipping default admin seed.");
            return;
        }

        User admin = User.builder()
                .name(ADMIN_NAME)
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .role(User.Role.ADMIN)
                .build();

        userRepository.save(admin);
        log.info("Default admin seeded with email: {}", ADMIN_EMAIL);
    }

    private boolean isMalformedBcrypt(String encodedPassword) {
        return encodedPassword == null
                || !encodedPassword.startsWith("$2")
                || encodedPassword.length() != 60;
    }
}
