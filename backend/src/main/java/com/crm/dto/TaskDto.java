package com.crm.dto;
import com.crm.entity.Task;
import lombok.*;
import java.time.LocalDateTime;

public class TaskDto {
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Request {
        private String title;
        private String description;
        private Task.Status status;
        private Task.Priority priority;
        private LocalDateTime dueDate;
        private Long assignedTo;
    }
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private String title;
        private String description;
        private Task.Status status;
        private Task.Priority priority;
        private LocalDateTime dueDate;
        private String assignedToName;
        private LocalDateTime createdAt;
    }
}
