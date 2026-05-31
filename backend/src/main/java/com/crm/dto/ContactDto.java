package com.crm.dto;
import lombok.*;
import java.time.LocalDateTime;

public class ContactDto {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String name;
        private String email;
        private String phone;
        private String company;
        private String position;
        private Long leadId;
        private String notes;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String company;
        private String position;
        private String notes;
        private LocalDateTime createdAt;
    }
}
