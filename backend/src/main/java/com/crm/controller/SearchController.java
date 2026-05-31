package com.crm.controller;

import com.crm.repository.ContactRepository;
import com.crm.repository.DealRepository;
import com.crm.repository.LeadRepository;
import com.crm.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;

    @GetMapping("/global")
    public ResponseEntity<?> globalSearch(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
                    "leads", List.of(),
                    "contacts", List.of(),
                    "deals", List.of(),
                    "tasks", List.of(),
                    "totalResults", 0
            )));
        }

        String q = query.trim().toLowerCase();

        List<Map<String, Object>> leads = leadRepository.findAll().stream()
                .filter(l -> matches(q, l.getName(), l.getEmail(), l.getCompany(), l.getPhone()))
                .limit(5)
                .map(l -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", l.getId());
                    map.put("name", l.getName());
                    map.put("email", l.getEmail());
                    map.put("company", l.getCompany());
                    map.put("status", l.getStatus() == null ? "NEW" : l.getStatus().name());
                    return map;
                })
                .toList();

        List<Map<String, Object>> contacts = contactRepository.findAll().stream()
                .filter(c -> matches(q, c.getName(), c.getEmail(), c.getCompany(), c.getPhone()))
                .limit(5)
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", c.getId());
                    map.put("name", c.getName());
                    map.put("email", c.getEmail());
                    map.put("company", c.getCompany());
                    map.put("position", c.getPosition());
                    return map;
                })
                .toList();

        List<Map<String, Object>> deals = dealRepository.findAll().stream()
                .filter(d -> matches(q, d.getTitle(), d.getNotes(),
                        d.getContact() != null ? d.getContact().getName() : null,
                        d.getContact() != null ? d.getContact().getCompany() : null))
                .limit(5)
                .map(d -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", d.getId());
                    map.put("title", d.getTitle());
                    map.put("value", d.getValue());
                    map.put("stage", d.getStage() == null ? "PROSPECTING" : d.getStage().name());
                    return map;
                })
                .toList();

        List<Map<String, Object>> tasks = taskRepository.findAll().stream()
                .filter(t -> matches(q, t.getTitle(), t.getDescription()))
                .limit(5)
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("title", t.getTitle());
                    map.put("status", t.getStatus() == null ? "PENDING" : t.getStatus().name());
                    map.put("priority", t.getPriority() == null ? "MEDIUM" : t.getPriority().name());
                    return map;
                })
                .toList();

        int total = leads.size() + contacts.size() + deals.size() + tasks.size();

        return ResponseEntity.ok(Map.of("success", true, "data", Map.of(
                "leads", leads,
                "contacts", contacts,
                "deals", deals,
                "tasks", tasks,
                "totalResults", total
        )));
    }

    private boolean matches(String query, String... fields) {
        for (String field : fields) {
            if (field != null && field.toLowerCase().contains(query)) {
                return true;
            }
        }
        return false;
    }
}
