package com.crm.dto;
import com.crm.entity.Deal;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DealDto {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String title;
        private BigDecimal value;
        private Deal.Stage stage;
        private Integer probability;
        private LocalDate expectedCloseDate;
        private Long contactId;
        private Long assignedTo;
        private String notes;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String title;
        private BigDecimal value;
        private Deal.Stage stage;
        private Integer probability;
        private LocalDate expectedCloseDate;
        private String contactName;
        private String assignedToName;
        private String notes;
        private LocalDateTime createdAt;
    }
}
