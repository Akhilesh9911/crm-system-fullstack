package com.crm.controller;
import com.crm.entity.Contact;
import com.crm.entity.Deal;
import com.crm.entity.DealNote;
import com.crm.entity.User;
import com.crm.repository.ContactRepository;
import com.crm.repository.DealNoteRepository;
import com.crm.repository.DealRepository;
import com.crm.service.ActivityService;
import com.crm.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
@Slf4j
public class DealController {
    private static final Set<Deal.Stage> PIPELINE_STAGES = Set.of(
            Deal.Stage.PROSPECTING,
            Deal.Stage.PROPOSAL,
            Deal.Stage.NEGOTIATION,
            Deal.Stage.CLOSED_WON,
            Deal.Stage.CLOSED_LOST
    );

    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final DealNoteRepository dealNoteRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllDeals() {
        try {
            List<Map<String, Object>> deals = dealRepository.findAll().stream()
                    .sorted(Comparator.comparing(Deal::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(LinkedHashMap<String, Deal>::new, (m, deal) -> m.putIfAbsent(buildDealKey(deal), deal), Map::putAll)
                    .values()
                    .stream()
                    .map(this::toDealResponse)
                    .toList();
            log.info("GET /api/deals -> {} unique records", deals.size());
            return ResponseEntity.ok(Map.of("success", true, "data", deals));
        } catch (Exception ex) {
            log.error("GET /api/deals failed", ex);
            return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createDeal(@RequestBody Map<String, Object> request) {
        Deal deal = new Deal();
        applyDealPayload(deal, request);
        Deal saved = dealRepository.save(deal);
        activityService.log("DEAL", "New deal created: " + saved.getTitle(), "DEAL", saved.getId());
        notificationService.notifyAll("New deal created: " + saved.getTitle(), "DEAL");
        return ResponseEntity.ok(Map.of("success", true, "message", "Deal created", "data", toDealResponse(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDeal(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Deal> existing = dealRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Deal not found"));
        }
        Deal deal = existing.get();
        applyDealPayload(deal, request);
        Deal saved = dealRepository.save(deal);
        activityService.log("DEAL", "Deal updated: " + saved.getTitle(), "DEAL", saved.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Deal updated", "data", toDealResponse(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDeal(@PathVariable Long id) {
        if (!dealRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Deal not found"));
        }
        dealRepository.deleteById(id);
        activityService.log("DEAL", "Deal deleted (ID: " + id + ")", "DEAL", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Deal deleted"));
    }

    @PatchMapping("/{id}/stage")
    public ResponseEntity<?> updateDealStage(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Deal> existing = dealRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Deal not found"));
        }
        Deal deal = existing.get();
        String stageValue = String.valueOf(request.getOrDefault("stage", "")).trim();
        if (!stageValue.isBlank()) {
            try {
                Deal.Stage requestedStage = normalizeStage(Deal.Stage.valueOf(stageValue));
                if (!PIPELINE_STAGES.contains(requestedStage)) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid stage value"));
                }
                deal.setStage(requestedStage);
            } catch (IllegalArgumentException ignored) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid stage value"));
            }
        }
        Deal saved = dealRepository.save(deal);
        activityService.log("DEAL", "Deal stage changed to " + saved.getStage().name() + ": " + saved.getTitle(), "DEAL", saved.getId());
        notificationService.notifyAll("Deal moved to " + saved.getStage().name() + ": " + saved.getTitle(), "DEAL");
        return ResponseEntity.ok(Map.of("success", true, "message", "Deal stage updated", "data", toDealResponse(saved)));
    }

    @GetMapping("/{dealId}/notes")
    public ResponseEntity<?> getDealNotes(@PathVariable Long dealId) {
        List<Map<String, Object>> notes = dealNoteRepository.findAll().stream()
                .filter(note -> note.getDeal() != null && dealId.equals(note.getDeal().getId()))
                .sorted(Comparator.comparing(DealNote::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDealNoteResponse)
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "data", notes));
    }

    @PostMapping("/{dealId}/notes")
    public ResponseEntity<?> addDealNote(
            @PathVariable Long dealId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User currentUser
    ) {
        Optional<Deal> deal = dealRepository.findById(dealId);
        if (deal.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Deal not found"));
        }

        String content = String.valueOf(request.getOrDefault("content", "")).trim();
        if (content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Note content is required"));
        }

        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
        }

        DealNote note = DealNote.builder()
                .deal(deal.get())
                .content(content)
                .createdBy(currentUser)
                .build();
        DealNote saved = dealNoteRepository.save(note);
        activityService.log("DEAL", "Note added to deal: " + deal.get().getTitle(), "DEAL", dealId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Note added", "data", toDealNoteResponse(saved)));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<?> deleteDealNote(@PathVariable Long noteId) {
        if (!dealNoteRepository.existsById(noteId)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Note not found"));
        }
        dealNoteRepository.deleteById(noteId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Note deleted"));
    }

    private void applyDealPayload(Deal deal, Map<String, Object> request) {
        deal.setTitle(getString(request, "title", deal.getTitle()));
        deal.setNotes(getString(request, "notes", deal.getNotes()));

        String valueRaw = getString(request, "value", null);
        if (valueRaw != null && !valueRaw.isBlank()) {
            try {
                deal.setValue(new BigDecimal(valueRaw));
            } catch (NumberFormatException ignored) {
                deal.setValue(BigDecimal.ZERO);
            }
        }

        String stageValue = getString(request, "stage", null);
        if (stageValue != null && !stageValue.isBlank()) {
            try {
                deal.setStage(normalizeStage(Deal.Stage.valueOf(stageValue)));
            } catch (IllegalArgumentException ignored) {
                deal.setStage(Deal.Stage.PROSPECTING);
            }
        } else if (deal.getStage() == null) {
            deal.setStage(Deal.Stage.PROSPECTING);
        }

        String expectedCloseDate = getString(request, "expectedCloseDate", null);
        if (expectedCloseDate != null && !expectedCloseDate.isBlank()) {
            try {
                deal.setExpectedCloseDate(LocalDate.parse(expectedCloseDate));
            } catch (Exception ignored) {
                deal.setExpectedCloseDate(null);
            }
        }

        Object contactIdRaw = request.get("contactId");
        if (contactIdRaw != null && !String.valueOf(contactIdRaw).isBlank()) {
            try {
                Long contactId = Long.valueOf(String.valueOf(contactIdRaw));
                Optional<Contact> contact = contactRepository.findById(contactId);
                deal.setContact(contact.orElse(null));
            } catch (NumberFormatException ignored) {
                deal.setContact(null);
            }
        } else {
            deal.setContact(null);
        }
    }

    private Map<String, Object> toDealResponse(Deal deal) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", deal.getId());
        response.put("title", deal.getTitle());
        response.put("value", deal.getValue());
        Deal.Stage stage = deal.getStage() == null ? Deal.Stage.PROSPECTING : normalizeStage(deal.getStage());
        response.put("stage", stage.name());
        response.put("expectedCloseDate", deal.getExpectedCloseDate());
        response.put("notes", deal.getNotes());
        response.put("createdAt", deal.getCreatedAt());
        response.put("contact", deal.getContact() == null
                ? null
                : Map.of(
                "id", deal.getContact().getId(),
                "name", deal.getContact().getName(),
                "company", deal.getContact().getCompany()
        ));
        return response;
    }

    private Map<String, Object> toDealNoteResponse(DealNote note) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", note.getId());
        response.put("content", note.getContent());
        response.put("createdAt", note.getCreatedAt());
        response.put("createdBy", note.getCreatedBy() == null
                ? null
                : Map.of(
                "id", note.getCreatedBy().getId(),
                "name", note.getCreatedBy().getName()
        ));
        return response;
    }

    private String getString(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private Deal.Stage normalizeStage(Deal.Stage stage) {
        return stage == Deal.Stage.QUALIFICATION ? Deal.Stage.PROPOSAL : stage;
    }

    private String buildDealKey(Deal deal) {
        if (deal.getId() != null) return "id:" + deal.getId();
        return "title:" + String.valueOf(deal.getTitle()) + "|contact:" + (deal.getContact() == null ? "none" : deal.getContact().getId());
    }
}
