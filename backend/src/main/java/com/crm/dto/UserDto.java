package com.crm.dto;
import com.crm.entity.User;
import lombok.*;
import java.time.LocalDateTime;

public class UserDto {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String name;
        private String email;
        private User.Role role;
        private LocalDateTime createdAt;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class UpdateRoleRequest {
        private User.Role role;
    }
}
