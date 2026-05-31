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
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getAllContacts() {
        try {
            List<Map<String, Object>> contacts = contactRepository.findAll().stream()
                    .sorted(Comparator.comparing(Contact::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(LinkedHashMap<String, Contact>::new, (m, contact) -> m.putIfAbsent(buildContactKey(contact), contact), Map::putAll)
                    .values()
                    .stream()
                    .map(this::toContactResponse)
                    .toList();
            log.info("GET /api/contacts -> {} unique records", contacts.size());
            return ResponseEntity.ok(Map.of("success", true, "data", contacts));
        } catch (Exception ex) {
            log.error("GET /api/contacts failed", ex);
            return ResponseEntity.ok(Map.of("success", true, "data", List.of()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getContactById(@PathVariable Long id) {
        Optional<Contact> contact = contactRepository.findById(id);
        if (contact.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contact not found"));
        }
        return ResponseEntity.ok(Map.of("success", true, "data", toContactResponse(contact.get())));
    }

    @PostMapping
    public ResponseEntity<?> createContact(@RequestBody Map<String, Object> request) {
        try {
            String incomingEmail = normalizeEmail(getString(request, "email", null));
            Contact contact = incomingEmail == null
                    ? new Contact()
                    : contactRepository.findByEmailIgnoreCase(incomingEmail).orElseGet(Contact::new);
            applyContactPayload(contact, request);
            Contact saved = contactRepository.save(contact);
            activityService.log("CONTACT", "New contact added: " + saved.getName(), "CONTACT", saved.getId());
            notificationService.notifyAll("New contact added: " + saved.getName(), "CONTACT");
            return ResponseEntity.ok(Map.of("success", true, "message", "Contact saved", "data", toContactResponse(saved)));
        } catch (DataIntegrityViolationException ex) {
            log.warn("Contact save conflict: {}", ex.getMessage());
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Contact email already exists"));
        } catch (Exception ex) {
            log.error("POST /api/contacts failed", ex);
            return ResponseEntity.ok(Map.of("success", true, "data", Map.of()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateContact(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<Contact> existing = contactRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contact not found"));
        }
        Contact contact = existing.get();
        applyContactPayload(contact, request);
        String normalizedEmail = normalizeEmail(contact.getEmail());
        if (normalizedEmail != null) {
            Optional<Contact> otherContact = contactRepository.findByEmailIgnoreCase(normalizedEmail);
            if (otherContact.isPresent() && !otherContact.get().getId().equals(contact.getId())) {
                return ResponseEntity.status(409).body(Map.of("success", false, "message", "Email already used by another contact"));
            }
        }
        Contact saved = contactRepository.save(contact);
        activityService.log("CONTACT", "Contact updated: " + saved.getName(), "CONTACT", saved.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Contact updated", "data", toContactResponse(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteContact(@PathVariable Long id) {
        if (!contactRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contact not found"));
        }
        contactRepository.deleteById(id);
        activityService.log("CONTACT", "Contact deleted (ID: " + id + ")", "CONTACT", id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Contact deleted"));
    }

    private void applyContactPayload(Contact contact, Map<String, Object> request) {
        contact.setName(getString(request, "name", contact.getName()));
        contact.setEmail(normalizeEmail(getString(request, "email", contact.getEmail())));
        contact.setPhone(getString(request, "phone", contact.getPhone()));
        contact.setCompany(getString(request, "company", contact.getCompany()));
        contact.setPosition(getString(request, "position", contact.getPosition()));
        contact.setNotes(getString(request, "notes", contact.getNotes()));

        if (request.containsKey("address")) {
            contact.setNotes(getString(request, "address", contact.getNotes()));
        }

        Object leadIdRaw = request.get("leadId");
        if (leadIdRaw != null && !String.valueOf(leadIdRaw).isBlank()) {
            try {
                Long leadId = Long.valueOf(String.valueOf(leadIdRaw));
                leadRepository.findById(leadId).ifPresent(contact::setLead);
            } catch (NumberFormatException ignored) {
                contact.setLead(null);
            }
        } else if (contact.getEmail() != null) {
            leadRepository.findByEmailIgnoreCase(contact.getEmail()).ifPresent(contact::setLead);
        }
    }

    private Map<String, Object> toContactResponse(Contact contact) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", contact.getId());
        response.put("name", contact.getName());
        response.put("email", contact.getEmail());
        response.put("phone", contact.getPhone());
        response.put("company", contact.getCompany());
        response.put("position", contact.getPosition());
        response.put("address", contact.getNotes());
        response.put("notes", contact.getNotes());
        response.put("createdAt", contact.getCreatedAt());
        response.put("lead", contact.getLead() == null
                ? null
                : Map.of("id", contact.getLead().getId(), "name", contact.getLead().getName()));
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

    private String buildContactKey(Contact contact) {
        if (contact.getId() != null) return "id:" + contact.getId();
        if (contact.getEmail() != null) return "email:" + contact.getEmail();
        return "name:" + String.valueOf(contact.getName());
    }
}
