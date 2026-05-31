package com.crm.dto;
import com.crm.entity.Lead;
import lombok.*;
import java.time.LocalDateTime;

public class LeadDto {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String name;
        private String email;
        private String phone;
        private String company;
        private Lead.Status status;
        private String source;
        private Long assignedTo;
        private String notes;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String company;
        private Lead.Status status;
        private String source;
        private String assignedToName;
        private String notes;
        private LocalDateTime createdAt;
    }
}
