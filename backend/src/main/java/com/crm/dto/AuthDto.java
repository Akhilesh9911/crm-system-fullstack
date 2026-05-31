package com.crm.dto;
import com.crm.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;

public class AuthDto {
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100)
        private String name;
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        @NotBlank(message = "Password is required")
        @Size(min = 6)
        private String password;
        private User.Role role;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token;
        private String type;
        private Long id;
        private String name;
        private String email;
        private String role;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "Token is required")
        private String token;
        @NotBlank(message = "Password is required")
        @Size(min = 6)
        private String newPassword;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class ValidateTokenRequest {
        @NotBlank(message = "Token is required")
        private String token;
    }
}
