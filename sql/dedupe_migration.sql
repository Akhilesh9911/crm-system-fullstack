-- Run this once before enabling strict unique constraints in production.
-- It keeps the earliest record per email and rewires relations.

USE crm_production;

-- Normalize emails for deterministic matching.
UPDATE users SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;
UPDATE leads SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;
UPDATE contacts SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Merge duplicate leads (keep smallest id).
UPDATE contacts c
JOIN leads l ON c.lead_id = l.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM leads
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) d ON l.email = d.email
SET c.lead_id = d.keep_id;

DELETE l1 FROM leads l1
JOIN leads l2 ON l1.email = l2.email AND l1.id > l2.id
WHERE l1.email IS NOT NULL AND l1.email <> '';

-- Merge duplicate contacts (keep smallest id), rewire deals.
UPDATE deals d
JOIN contacts c ON d.contact_id = c.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM contacts
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON c.email = dup.email
SET d.contact_id = dup.keep_id;

DELETE c1 FROM contacts c1
JOIN contacts c2 ON c1.email = c2.email AND c1.id > c2.id
WHERE c1.email IS NOT NULL AND c1.email <> '';

-- Merge duplicate users by email (keep smallest id), rewire references.
UPDATE tasks t
JOIN users u ON t.assigned_to = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET t.assigned_to = dup.keep_id;

UPDATE leads l
JOIN users u ON l.assigned_to = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET l.assigned_to = dup.keep_id;

UPDATE deals d
JOIN users u ON d.assigned_to = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET d.assigned_to = dup.keep_id;

UPDATE activities a
JOIN users u ON a.created_by = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET a.created_by = dup.keep_id;

UPDATE notifications n
JOIN users u ON n.user_id = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET n.user_id = dup.keep_id;

UPDATE deal_notes dn
JOIN users u ON dn.created_by = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET dn.created_by = dup.keep_id;

UPDATE password_reset_tokens p
JOIN users u ON p.user_id = u.id
JOIN (
  SELECT email, MIN(id) AS keep_id
  FROM users
  WHERE email IS NOT NULL AND email <> ''
  GROUP BY email
  HAVING COUNT(*) > 1
) dup ON u.email = dup.email
SET p.user_id = dup.keep_id;

DELETE u1 FROM users u1
JOIN users u2 ON u1.email = u2.email AND u1.id > u2.id
WHERE u1.email IS NOT NULL AND u1.email <> '';
