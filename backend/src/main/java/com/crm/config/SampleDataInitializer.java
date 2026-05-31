package com.crm.config;

import com.crm.entity.*;
import com.crm.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SampleDataInitializer implements CommandLineRunner {

    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityRepository activityRepository;

    @Override
    public void run(String... args) {
        User assignee = userRepository.findByEmail("admin@crm.com").orElseGet(() -> userRepository.findAll().stream().findFirst().orElse(null));
        if (assignee == null) {
            log.warn("Skipping sample CRM data seed because no users exist.");
            return;
        }

        Lead lead1 = leadRepository.findByEmailIgnoreCase("john@example.com").orElse(null);
        Lead lead2 = leadRepository.findByEmailIgnoreCase("jane@example.com").orElse(null);
        Lead lead3 = leadRepository.findByEmailIgnoreCase("michael@globaltech.com").orElse(null);
        Lead lead4 = leadRepository.findByEmailIgnoreCase("sara@ventures.com").orElse(null);

        if (leadRepository.count() == 0) {
            lead1 = Lead.builder()
                    .name("John Doe").email("john@example.com").phone("123-456-7890")
                    .company("Tech Corp").status(Lead.Status.NEW).source("Website")
                    .assignedTo(assignee).notes("Interested in enterprise plan").build();
            lead2 = Lead.builder()
                    .name("Jane Smith").email("jane@example.com").phone("098-765-4321")
                    .company("Innovation Inc").status(Lead.Status.CONTACTED).source("Referral")
                    .assignedTo(assignee).notes("Follow up next week").build();
            lead3 = Lead.builder()
                    .name("Michael Brown").email("michael@globaltech.com").phone("555-100-2000")
                    .company("Global Tech").status(Lead.Status.QUALIFIED).source("LinkedIn")
                    .assignedTo(assignee).notes("Demo scheduled for next Friday").build();
            lead4 = Lead.builder()
                    .name("Sara Connor").email("sara@ventures.com").phone("444-200-3000")
                    .company("Ventures Ltd").status(Lead.Status.NEW).source("Cold Call")
                    .assignedTo(assignee).notes("Interested in starter plan").build();
            leadRepository.saveAll(List.of(lead1, lead2, lead3, lead4));
        }

        Contact contact1 = contactRepository.findByEmailIgnoreCase("alice@techcorp.com").orElse(null);
        Contact contact2 = contactRepository.findByEmailIgnoreCase("bob@innovation.com").orElse(null);
        Contact contact3 = contactRepository.findByEmailIgnoreCase("carol@globaltech.com").orElse(null);

        if (contactRepository.count() == 0) {
            contact1 = Contact.builder()
                    .name("Alice Johnson").email("alice@techcorp.com").phone("111-222-3333")
                    .company("Tech Corp").position("CTO").lead(lead1).notes("Decision maker").build();
            contact2 = Contact.builder()
                    .name("Bob Williams").email("bob@innovation.com").phone("444-555-6666")
                    .company("Innovation Inc").position("Manager").lead(lead2).notes("Budget approver").build();
            contact3 = Contact.builder()
                    .name("Carol Davis").email("carol@globaltech.com").phone("777-888-9999")
                    .company("Global Tech").position("VP Sales").lead(lead3).notes("Key stakeholder").build();
            contactRepository.saveAll(List.of(contact1, contact2, contact3));
        }

        if (dealRepository.count() == 0) {
            Deal deal1 = Deal.builder()
                    .title("Enterprise License - Tech Corp").value(new BigDecimal("50000"))
                    .stage(Deal.Stage.PROPOSAL).expectedCloseDate(LocalDate.now().plusDays(30))
                    .contact(contact1).assignedTo(assignee).notes("1 year contract").build();
            Deal deal2 = Deal.builder()
                    .title("Consulting Services - Innovation").value(new BigDecimal("25000"))
                    .stage(Deal.Stage.NEGOTIATION).expectedCloseDate(LocalDate.now().plusDays(45))
                    .contact(contact2).assignedTo(assignee).notes("6 month engagement").build();
            Deal deal3 = Deal.builder()
                    .title("Platform Subscription - Global Tech").value(new BigDecimal("75000"))
                    .stage(Deal.Stage.PROSPECTING).expectedCloseDate(LocalDate.now().plusDays(60))
                    .contact(contact3).assignedTo(assignee).notes("Annual subscription deal").build();
            Deal deal4 = Deal.builder()
                    .title("Support Package - Innovation Inc").value(new BigDecimal("12000"))
                    .stage(Deal.Stage.CLOSED_WON).expectedCloseDate(LocalDate.now().minusDays(5))
                    .contact(contact2).assignedTo(assignee).notes("Closed successfully").build();
            dealRepository.saveAll(List.of(deal1, deal2, deal3, deal4));
        }

        if (taskRepository.count() == 0) {
            Task task1 = Task.builder()
                    .title("Follow up with Tech Corp").description("Send proposal document")
                    .status(Task.Status.PENDING).priority(Task.Priority.HIGH)
                    .dueDate(LocalDateTime.now().plusDays(2)).assignedTo(assignee).build();
            Task task2 = Task.builder()
                    .title("Prepare demo for Innovation Inc").description("Setup demo environment")
                    .status(Task.Status.IN_PROGRESS).priority(Task.Priority.MEDIUM)
                    .dueDate(LocalDateTime.now().plusDays(5)).assignedTo(assignee).build();
            Task task3 = Task.builder()
                    .title("Send contract to Global Tech").description("Finalize legal review and send")
                    .status(Task.Status.PENDING).priority(Task.Priority.HIGH)
                    .dueDate(LocalDateTime.now().plusDays(1)).assignedTo(assignee).build();
            Task task4 = Task.builder()
                    .title("Onboard Ventures Ltd").description("Initial onboarding call")
                    .status(Task.Status.PENDING).priority(Task.Priority.LOW)
                    .dueDate(LocalDateTime.now().plusDays(10)).assignedTo(assignee).build();
            taskRepository.saveAll(List.of(task1, task2, task3, task4));
        }

        if (notificationRepository.count() == 0) {
            Notification n1 = Notification.builder().user(assignee)
                    .message("New lead assigned: John Doe from Tech Corp").type("LEAD").read(false).build();
            Notification n2 = Notification.builder().user(assignee)
                    .message("Task due soon: Follow up with Tech Corp").type("TASK").read(false).build();
            Notification n3 = Notification.builder().user(assignee)
                    .message("Deal moved to Negotiation: Consulting Services - Innovation").type("DEAL").read(false).build();
            Notification n4 = Notification.builder().user(assignee)
                    .message("New contact added: Alice Johnson (CTO, Tech Corp)").type("CONTACT").read(false).build();
            Notification n5 = Notification.builder().user(assignee)
                    .message("Deal CLOSED WON: Support Package - Innovation Inc ($12,000)").type("DEAL").read(false).build();
            Notification n6 = Notification.builder().user(assignee)
                    .message("Lead qualified: Michael Brown from Global Tech").type("LEAD").read(true).build();
            notificationRepository.saveAll(List.of(n1, n2, n3, n4, n5, n6));
        }

        if (activityRepository.count() == 0) {
            Activity a1 = Activity.builder().type("LEAD").description("New lead created: John Doe (Tech Corp)")
                    .entityType("LEAD").entityId(1L).createdBy(assignee).build();
            Activity a2 = Activity.builder().type("LEAD").description("New lead created: Jane Smith (Innovation Inc)")
                    .entityType("LEAD").entityId(2L).createdBy(assignee).build();
            Activity a3 = Activity.builder().type("CONTACT").description("Contact added: Alice Johnson - CTO at Tech Corp")
                    .entityType("CONTACT").entityId(1L).createdBy(assignee).build();
            Activity a4 = Activity.builder().type("DEAL").description("New deal created: Enterprise License - Tech Corp ($50,000)")
                    .entityType("DEAL").entityId(1L).createdBy(assignee).build();
            Activity a5 = Activity.builder().type("DEAL").description("Deal stage updated to NEGOTIATION: Consulting Services")
                    .entityType("DEAL").entityId(2L).createdBy(assignee).build();
            Activity a6 = Activity.builder().type("TASK").description("Task created: Follow up with Tech Corp (HIGH priority)")
                    .entityType("TASK").entityId(1L).createdBy(assignee).build();
            Activity a7 = Activity.builder().type("LEAD").description("Lead converted to contact: Jane Smith")
                    .entityType("LEAD").entityId(2L).createdBy(assignee).build();
            Activity a8 = Activity.builder().type("DEAL").description("Deal CLOSED WON: Support Package - Innovation Inc")
                    .entityType("DEAL").entityId(4L).createdBy(assignee).build();
            Activity a9 = Activity.builder().type("CONTACT").description("New contact added: Carol Davis - VP Sales at Global Tech")
                    .entityType("CONTACT").entityId(3L).createdBy(assignee).build();
            Activity a10 = Activity.builder().type("TASK").description("Task marked complete: Prepare demo environment")
                    .entityType("TASK").entityId(2L).createdBy(assignee).build();
            activityRepository.saveAll(List.of(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10));
        }

        log.info("Sample CRM records seeded successfully.");
    }
}
