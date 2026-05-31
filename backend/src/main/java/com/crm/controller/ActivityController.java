package com.crm.controller;

import com.crm.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityRepository activityRepository;

    @GetMapping
    public ResponseEntity<?> getActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var activities = activityRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        List<Map<String, Object>> data = activities.stream()
                .map(activity -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", activity.getId());
                    row.put("type", activity.getType());
                    row.put("description", activity.getDescription());
                    row.put("entityType", activity.getEntityType());
                    row.put("entityId", activity.getEntityId());
                    row.put("createdAt", activity.getCreatedAt());
                    row.put("createdBy", activity.getCreatedBy() == null
                            ? Map.of("name", "System")
                            : Map.of("id", activity.getCreatedBy().getId(), "name", activity.getCreatedBy().getName()));
                    return row;
                })
                .toList();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", data
        ));
    }
}
