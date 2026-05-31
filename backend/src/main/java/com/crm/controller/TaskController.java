package com.crm.controller;
import com.crm.entity.Task;
import com.crm.repository.TaskRepository;
import com.crm.service.ActivityService;
import com.crm.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository taskRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllTasks() {
        List<Map<String, Object>> tasks = taskRepository.findAll().stream()
                .sorted(Comparator.comparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toTaskResponse)
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "data", tasks));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> request) {
        Task task = new Task();
        applyTaskPayload(task, request);
        Task saved = taskRepository.save(task);
        activityService.log("TASK", "New task created: " + saved.getTitle(), "TASK", saved.getId());
        notificationService.notifyAll("New task created: " + saved.getTitle(), "TASK");
        return ResponseEntity.ok(Map.of("success", true, "message", "Task created", "data", toTaskResponse(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Task> existing = taskRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Task not found"));
        }
        Task task = existing.get();
        applyTaskPayload(task, request);
        Task saved = taskRepository.save(task);
        activityService.log("TASK", "Task updated: " + saved.getTitle(), "TASK", saved.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Task updated", "data", toTaskResponse(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Task not found"));
        }
        taskRepository.deleteById(id);
        activityService.log("TASK", "Task deleted (ID: " + id + ")", "TASK", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Task deleted"));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> markTaskComplete(@PathVariable Long id) {
        Optional<Task> existing = taskRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Task not found"));
        }
        Task task = existing.get();
        task.setStatus(Task.Status.COMPLETED);
        Task saved = taskRepository.save(task);
        activityService.log("TASK", "Task completed: " + saved.getTitle(), "TASK", saved.getId());
        notificationService.notifyAll("Task completed: " + saved.getTitle(), "TASK");
        return ResponseEntity.ok(Map.of("success", true, "message", "Task marked complete", "data", toTaskResponse(saved)));
    }

    private void applyTaskPayload(Task task, Map<String, Object> request) {
        task.setTitle(getString(request, "title", task.getTitle()));
        task.setDescription(getString(request, "description", task.getDescription()));

        String statusValue = getString(request, "status", null);
        if (statusValue != null && !statusValue.isBlank()) {
            try {
                task.setStatus(Task.Status.valueOf(statusValue));
            } catch (IllegalArgumentException ignored) {
                task.setStatus(Task.Status.PENDING);
            }
        } else if (task.getStatus() == null) {
            task.setStatus(Task.Status.PENDING);
        }

        String priorityValue = getString(request, "priority", null);
        if (priorityValue != null && !priorityValue.isBlank()) {
            try {
                task.setPriority(Task.Priority.valueOf(priorityValue));
            } catch (IllegalArgumentException ignored) {
                task.setPriority(Task.Priority.MEDIUM);
            }
        } else if (task.getPriority() == null) {
            task.setPriority(Task.Priority.MEDIUM);
        }

        String dueDateValue = getString(request, "dueDate", null);
        if (dueDateValue != null && !dueDateValue.isBlank()) {
            try {
                if (dueDateValue.length() == 10) {
                    task.setDueDate(LocalDate.parse(dueDateValue).atStartOfDay());
                } else {
                    task.setDueDate(LocalDateTime.parse(dueDateValue));
                }
            } catch (Exception ignored) {
                task.setDueDate(null);
            }
        }
    }

    private Map<String, Object> toTaskResponse(Task task) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", task.getId());
        response.put("title", task.getTitle());
        response.put("description", task.getDescription());
        response.put("status", task.getStatus() == null ? Task.Status.PENDING.name() : task.getStatus().name());
        response.put("priority", task.getPriority() == null ? Task.Priority.MEDIUM.name() : task.getPriority().name());
        response.put("dueDate", task.getDueDate());
        response.put("createdAt", task.getCreatedAt());
        response.put("overdue", task.getDueDate() != null
                && task.getStatus() != Task.Status.COMPLETED
                && task.getDueDate().isBefore(LocalDateTime.now()));
        return response;
    }

    private String getString(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        return value == null ? fallback : String.valueOf(value);
    }
}
