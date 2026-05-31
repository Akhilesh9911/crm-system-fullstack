package com.crm.controller;
import com.crm.entity.Contact;
import com.crm.entity.Lead;
import com.crm.repository.ContactRepository;
import com.crm.repository.LeadRepository;
import com.crm.service.ActivityService;
import com.crm.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
@Slf4j
public class LeadController {

    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllLeads() {
        try {
            List<Map<String, Object>> leads = leadRepository.findAll().stream()
                    .sorted(Comparator.comparing(Lead::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(LinkedHashMap<String, Lead>::new, (m, lead) -> m.putIfAbsent(buildLeadKey(lead), lead), Map::putAll)
                    .values()
                    .stream()
                    .map(this::toLeadResponse)
                    .toList();
            log.info("GET /api/leads -> {} unique records", leads.size());
            return ResponseEntity.ok(Map.of("success", true, "data", leads));
        } catch (Exception ex) {
            log.error("GET /api/leads failed", ex);
            return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createLead(@RequestBody Map<String, Object> request) {
        try {
            String incomingEmail = normalizeEmail(getString(request, "email", null));
            Lead lead = incomingEmail == null
                    ? new Lead()
                    : leadRepository.findByEmailIgnoreCase(incomingEmail).orElseGet(Lead::new);
            applyLeadPayload(lead, request);
            Lead saved = leadRepository.save(lead);
            linkContactByEmail(saved);
            activityService.log("LEAD", "New lead created: " + saved.getName(), "LEAD", saved.getId());
            notificationService.notifyAll("New lead added: " + saved.getName(), "LEAD");
            return ResponseEntity.ok(Map.of("success", true, "message", "Lead saved", "data", toLeadResponse(saved)));
        } catch (DataIntegrityViolationException ex) {
            log.warn("Lead save conflict: {}", ex.getMessage());
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Lead email already exists"));
        } catch (Exception ex) {
            log.error("POST /api/leads failed", ex);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLeadById(@PathVariable Long id) {
        Optional<Lead> lead = leadRepository.findById(id);
        if (lead.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Lead not found"));
        }
        return ResponseEntity.ok(Map.of("success", true, "data", toLeadResponse(lead.get())));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLead(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Lead> existing = leadRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Lead not found"));
        }
        Lead lead = existing.get();
        applyLeadPayload(lead, request);
        String normalizedEmail = normalizeEmail(lead.getEmail());
        if (normalizedEmail != null) {
            Optional<Lead> otherLead = leadRepository.findByEmailIgnoreCase(normalizedEmail);
            if (otherLead.isPresent() && !otherLead.get().getId().equals(lead.getId())) {
                return ResponseEntity.status(409).body(Map.of("success", false, "message", "Email already used by another lead"));
            }
        }
        Lead saved = leadRepository.save(lead);
        linkContactByEmail(saved);
        activityService.log("LEAD", "Lead updated: " + saved.getName(), "LEAD", saved.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Lead updated", "data", toLeadResponse(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLead(@PathVariable Long id) {
        if (!leadRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Lead not found"));
        }
        leadRepository.deleteById(id);
        activityService.log("LEAD", "Lead deleted (ID: " + id + ")", "LEAD", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Lead deleted"));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertLead(@PathVariable Long id) {
        Optional<Lead> existing = leadRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Lead not found"));
        }

        Lead lead = existing.get();
        Contact contact = contactRepository.findByEmailIgnoreCase(lead.getEmail())
                .orElseGet(Contact::new);
        contact.setName(lead.getName());
        contact.setEmail(lead.getEmail());
        contact.setPhone(lead.getPhone());
        contact.setCompany(lead.getCompany());
        contact.setLead(lead);
        contact.setNotes(lead.getNotes());
        contactRepository.save(contact);

        lead.setStatus(Lead.Status.CONVERTED);
        leadRepository.save(lead);

        activityService.log("LEAD", "Lead converted to contact: " + lead.getName(), "LEAD", lead.getId());
        notificationService.notifyAll("Lead converted: " + lead.getName() + " is now a Contact", "LEAD");
        return ResponseEntity.ok(Map.of("success", true, "message", "Lead converted"));
    }

    private void applyLeadPayload(Lead lead, Map<String, Object> request) {
        lead.setName(getString(request, "name", lead.getName()));
        lead.setEmail(normalizeEmail(getString(request, "email", lead.getEmail())));
        lead.setPhone(getString(request, "phone", lead.getPhone()));
        lead.setCompany(getString(request, "company", lead.getCompany()));
        lead.setSource(getString(request, "source", lead.getSource()));
        lead.setNotes(getString(request, "notes", lead.getNotes()));

        String statusValue = getString(request, "status", null);
        if (statusValue != null && !statusValue.isBlank()) {
            try {
                lead.setStatus(Lead.Status.valueOf(statusValue));
            } catch (IllegalArgumentException ignored) {
                lead.setStatus(Lead.Status.NEW);
            }
        } else if (lead.getStatus() == null) {
            lead.setStatus(Lead.Status.NEW);
        }
    }

    private Map<String, Object> toLeadResponse(Lead lead) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", lead.getId());
        response.put("name", lead.getName());
        response.put("email", lead.getEmail());
        response.put("phone", lead.getPhone());
        response.put("company", lead.getCompany());
        response.put("status", lead.getStatus() == null ? "NEW" : lead.getStatus().name());
        response.put("source", lead.getSource());
        response.put("notes", lead.getNotes());
        response.put("createdAt", lead.getCreatedAt());
        response.put("assignedTo", lead.getAssignedTo() == null
                ? null
                : Map.of(
                "id", lead.getAssignedTo().getId(),
                "name", lead.getAssignedTo().getName()
        ));
        return response;
    }

    private String getString(Map<String, Object> source, String key, String fallback) {
        Object value = source.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private String normalizeEmail(String email) {
        if (email == null) return null;
        String normalized = email.trim().toLowerCase();
        return normalized.isBlank() ? null : normalized;
    }

    private void linkContactByEmail(Lead lead) {
        if (lead.getEmail() == null) return;
        contactRepository.findByEmailIgnoreCase(lead.getEmail()).ifPresent(contact -> {
            if (contact.getLead() == null || !lead.getId().equals(contact.getLead().getId())) {
                contact.setLead(lead);
                contactRepository.save(contact);
            }
        });
    }

    private String buildLeadKey(Lead lead) {
        if (lead.getId() != null) return "id:" + lead.getId();
        if (lead.getEmail() != null) return "email:" + lead.getEmail();
        return "name:" + String.valueOf(lead.getName());
    }
}
