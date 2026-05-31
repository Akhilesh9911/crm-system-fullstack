package com.crm.controller;
import com.crm.entity.Deal;
import com.crm.entity.Lead;
import com.crm.entity.Task;
import com.crm.repository.ContactRepository;
import com.crm.repository.DealRepository;
import com.crm.repository.LeadRepository;
import com.crm.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        try {
            List<Deal> deals = dealRepository.findAll();

            long openDeals = deals.stream()
                    .filter(deal -> deal.getStage() != Deal.Stage.CLOSED_WON && deal.getStage() != Deal.Stage.CLOSED_LOST)
                    .count();

            BigDecimal totalDealValue = deals.stream()
                    .map(Deal::getValue)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long pendingTasks = taskRepository.findAll().stream()
                    .filter(task -> task.getStatus() == Task.Status.PENDING)
                    .count();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "totalLeads", leadRepository.count(),
                            "totalContacts", contactRepository.count(),
                            "openDeals", openDeals,
                            "pendingTasks", pendingTasks,
                            "totalDealValue", totalDealValue
                    )
            ));
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                            "totalLeads", 0,
                            "totalContacts", 0,
                            "openDeals", 0,
                            "pendingTasks", 0,
                            "totalDealValue", BigDecimal.ZERO
                    )
            ));
        }
    }

    @GetMapping("/deals-by-stage")
    public ResponseEntity<?> getDealsByStage() {
        try {
            Map<Deal.Stage, Long> counts = dealRepository.findAll().stream()
                    .filter(deal -> deal.getStage() != null)
                    .collect(Collectors.groupingBy(Deal::getStage, Collectors.counting()));

            List<Map<String, Object>> data = Arrays.stream(Deal.Stage.values())
                    .map(stage -> Map.<String, Object>of(
                            "stage", stage.name(),
                            "count", counts.getOrDefault(stage, 0L)
                    ))
                    .toList();

            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception ex) {
            List<Map<String, Object>> data = Arrays.stream(Deal.Stage.values())
                    .map(stage -> Map.<String, Object>of("stage", stage.name(), "count", 0L))
                    .toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        }
    }

    @GetMapping("/leads-by-month")
    public ResponseEntity<?> getLeadsByMonth() {
        try {
            YearMonth current = YearMonth.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

            Map<YearMonth, Long> counts = leadRepository.findAll().stream()
                    .filter(lead -> lead.getCreatedAt() != null)
                    .collect(Collectors.groupingBy(
                            lead -> YearMonth.from(lead.getCreatedAt()),
                            Collectors.counting()
                    ));

            List<Map<String, Object>> data = new ArrayList<>();
            for (int i = 5; i >= 0; i--) {
                YearMonth month = current.minusMonths(i);
                data.add(Map.of(
                        "month", month.format(formatter),
                        "count", counts.getOrDefault(month, 0L)
                ));
            }

            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception ex) {
            return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
        }
    }

    @GetMapping("/tasks-by-priority")
    public ResponseEntity<?> getTasksByPriority() {
        try {
            Map<Task.Priority, Long> counts = taskRepository.findAll().stream()
                    .filter(task -> task.getPriority() != null)
                    .collect(Collectors.groupingBy(Task::getPriority, Collectors.counting()));

            List<Map<String, Object>> data = Arrays.stream(Task.Priority.values())
                    .map(priority -> Map.<String, Object>of(
                            "priority", priority.name(),
                            "count", counts.getOrDefault(priority, 0L)
                    ))
                    .toList();

            return ResponseEntity.ok(Map.of("success", true, "data", data));
        } catch (Exception ex) {
            List<Map<String, Object>> data = Arrays.stream(Task.Priority.values())
                    .map(priority -> Map.<String, Object>of("priority", priority.name(), "count", 0L))
                    .toList();
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        }
    }
}
