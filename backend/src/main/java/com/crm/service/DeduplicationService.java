package com.crm.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeduplicationService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void runManualDeduplication() {
        dedupeUsers();
        dedupeLeads();
        dedupeContacts();
        normalizeEmails("users");
        normalizeEmails("leads");
        normalizeEmails("contacts");
        log.info("Manual email deduplication finished.");
    }

    private void dedupeUsers() {
        for (List<Long> ids : fetchDuplicateIdGroups("users")) {
            Long keeperId = ids.get(0);
            List<Long> duplicateIds = ids.subList(1, ids.size());

            updateForeignKeys("tasks", "assigned_to", keeperId, duplicateIds);
            updateForeignKeys("leads", "assigned_to", keeperId, duplicateIds);
            updateForeignKeys("deals", "assigned_to", keeperId, duplicateIds);
            updateForeignKeys("notifications", "user_id", keeperId, duplicateIds);
            updateForeignKeys("activities", "created_by", keeperId, duplicateIds);
            updateForeignKeys("deal_notes", "created_by", keeperId, duplicateIds);

            deleteByIds("users", duplicateIds);
            log.info("Removed {} duplicate user rows; kept user id={}", duplicateIds.size(), keeperId);
        }
    }

    private void dedupeLeads() {
        for (List<Long> ids : fetchDuplicateIdGroups("leads")) {
            Long keeperId = ids.get(0);
            List<Long> duplicateIds = ids.subList(1, ids.size());
            if (duplicateIds.isEmpty()) {
                continue;
            }

            Integer keeperContactCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM contacts WHERE lead_id = ?",
                    Integer.class,
                    keeperId
            );

            Long contactToRepoint = jdbcTemplate.query(
                    "SELECT id FROM contacts WHERE lead_id IN (" + toInClause(duplicateIds) + ") ORDER BY id ASC",
                    rs -> rs.next() ? rs.getLong("id") : null
            );

            if ((keeperContactCount == null || keeperContactCount == 0) && contactToRepoint != null) {
                jdbcTemplate.update("UPDATE contacts SET lead_id = ? WHERE id = ?", keeperId, contactToRepoint);
            }

            jdbcTemplate.update("UPDATE contacts SET lead_id = NULL WHERE lead_id IN (" + toInClause(duplicateIds) + ")");
            deleteByIds("leads", duplicateIds);
            log.info("Removed {} duplicate lead rows; kept lead id={}", duplicateIds.size(), keeperId);
        }
    }

    private void dedupeContacts() {
        for (List<Long> ids : fetchDuplicateIdGroups("contacts")) {
            Long keeperId = ids.get(0);
            List<Long> duplicateIds = ids.subList(1, ids.size());

            updateForeignKeys("deals", "contact_id", keeperId, duplicateIds);
            deleteByIds("contacts", duplicateIds);
            log.info("Removed {} duplicate contact rows; kept contact id={}", duplicateIds.size(), keeperId);
        }
    }

    private List<List<Long>> fetchDuplicateIdGroups(String tableName) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT GROUP_CONCAT(id ORDER BY id) AS ids " +
                        "FROM " + tableName + " " +
                        "WHERE email IS NOT NULL AND TRIM(email) <> '' " +
                        "GROUP BY LOWER(TRIM(email)) " +
                        "HAVING COUNT(*) > 1"
        );

        List<List<Long>> groups = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Object idsRaw = row.get("ids");
            if (idsRaw == null) {
                continue;
            }
            List<Long> ids = Arrays.stream(String.valueOf(idsRaw).split(","))
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .map(Long::valueOf)
                    .collect(Collectors.toList());
            if (ids.size() > 1) {
                groups.add(ids);
            }
        }
        return groups;
    }

    private void normalizeEmails(String tableName) {
        int updated = jdbcTemplate.update(
                "UPDATE " + tableName + " SET email = LOWER(TRIM(email)) " +
                        "WHERE email IS NOT NULL AND email <> LOWER(TRIM(email))"
        );
        if (updated > 0) {
            log.info("Normalized {} email values in {}", updated, tableName);
        }
    }

    private void updateForeignKeys(String tableName, String fkColumn, Long keeperId, List<Long> duplicateIds) {
        if (duplicateIds.isEmpty()) {
            return;
        }
        jdbcTemplate.update(
                "UPDATE " + tableName + " SET " + fkColumn + " = ? WHERE " + fkColumn + " IN (" + toInClause(duplicateIds) + ")",
                keeperId
        );
    }

    private void deleteByIds(String tableName, List<Long> ids) {
        if (ids.isEmpty()) {
            return;
        }
        jdbcTemplate.update("DELETE FROM " + tableName + " WHERE id IN (" + toInClause(ids) + ")");
    }

    private String toInClause(List<Long> ids) {
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }
}
