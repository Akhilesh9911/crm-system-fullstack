package com.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        if (mailSender == null) {
            log.warn("Mail sender not configured. Skipping password reset email to: {}", toEmail);
            return;
        }
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + resetToken;
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Password Reset Request");
            message.setText(String.format(
                "Hello %s,\n\nClick the link below to reset your password:\n%s\n\nThis link will expire in 1 hour.\n\nBest regards,\nCRM Team",
                userName, resetUrl
            ));
            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to: {}", toEmail, e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String userName) {
        if (mailSender == null) {
            log.warn("Mail sender not configured. Skipping welcome email to: {}", toEmail);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to CRM System");
            message.setText(String.format(
                "Hello %s,\n\nWelcome to CRM System!\n\nYour account has been created successfully.\n\nBest regards,\nCRM Team",
                userName
            ));
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}", toEmail, e);
        }
    }
}