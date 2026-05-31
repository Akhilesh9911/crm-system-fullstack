-- CRM Production Database Schema
-- Drop database if exists and create fresh
DROP DATABASE IF EXISTS crm_production;
CREATE DATABASE crm_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_production;

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE leads (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(100),
    status ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST') DEFAULT 'NEW',
    source VARCHAR(50),
    assigned_to BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONTACTS TABLE
-- =====================================================
CREATE TABLE contacts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(100),
    position VARCHAR(100),
    lead_id BIGINT UNIQUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_company (company),
    INDEX idx_lead_id (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEALS TABLE
-- =====================================================
CREATE TABLE deals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    value DECIMAL(15,2),
    stage ENUM('PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST') DEFAULT 'PROSPECTING',
    probability INT DEFAULT 0,
    expected_close_date DATE,
    contact_id BIGINT,
    assigned_to BIGINT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stage (stage),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_contact_id (contact_id),
    INDEX idx_expected_close (expected_close_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DEAL NOTES TABLE
-- =====================================================
CREATE TABLE deal_notes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    deal_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_deal_id (deal_id),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TASKS TABLE
-- =====================================================
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    due_date TIMESTAMP,
    assigned_to BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ACTIVITIES TABLE
-- =====================================================
CREATE TABLE activities (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_by (created_by),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@crm.com', '$2a$10$Y5kZQvZQqZvZQqZvZQqZuOXxWQvZQqZvZQqZvZQqZvZQqZvZQqZvZQ', 'ADMIN');

-- Test User (password: user123)
INSERT INTO users (name, email, password, role) VALUES 
('Test User', 'user@crm.com', '$2a$10$Z6lAQvZQqZvZQqZvZQqZuPYyXQvZQqZvZQqZvZQqZvZQqZvZQqZvZR', 'USER');

-- Sample Leads
INSERT INTO leads (name, email, phone, company, status, source, assigned_to, notes) VALUES
('John Doe', 'john@example.com', '123-456-7890', 'Tech Corp', 'NEW', 'Website', 1, 'Interested in our enterprise plan'),
('Jane Smith', 'jane@example.com', '098-765-4321', 'Innovation Inc', 'CONTACTED', 'Referral', 2, 'Following up next week');

-- Sample Contacts
INSERT INTO contacts (name, email, phone, company, position, lead_id, notes) VALUES
('Alice Johnson', 'alice@techcorp.com', '111-222-3333', 'Tech Corp', 'CTO', 1, 'Decision maker'),
('Bob Williams', 'bob@innovation.com', '444-555-6666', 'Innovation Inc', 'Manager', 2, 'Budget approver');

-- Sample Deals
INSERT INTO deals (title, value, stage, probability, expected_close_date, contact_id, assigned_to, notes) VALUES
('Enterprise License - Tech Corp', 50000.00, 'PROPOSAL', 75, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 1, '1 year contract'),
('Consulting Services - Innovation', 25000.00, 'NEGOTIATION', 60, DATE_ADD(CURDATE(), INTERVAL 45 DAY), 2, 2, '6 month engagement');

-- Sample Tasks
INSERT INTO tasks (title, description, status, priority, due_date, assigned_to) VALUES
('Follow up with Tech Corp', 'Send proposal document', 'PENDING', 'HIGH', DATE_ADD(NOW(), INTERVAL 2 DAY), 1),
('Prepare demo for Innovation Inc', 'Setup demo environment', 'IN_PROGRESS', 'MEDIUM', DATE_ADD(NOW(), INTERVAL 5 DAY), 2);

-- Sample Activities
INSERT INTO activities (type, description, entity_type, entity_id, created_by) VALUES
('LEAD_CREATED', 'New lead from website form', 'LEAD', 1, 1),
('DEAL_UPDATED', 'Deal moved to proposal stage', 'DEAL', 1, 1);

-- Sample Notifications
INSERT INTO notifications (user_id, message, type, is_read) VALUES
(1, 'New lead assigned to you', 'LEAD_ASSIGNMENT', FALSE),
(2, 'Task due tomorrow', 'TASK_REMINDER', FALSE);

-- =====================================================
-- VERIFY INSTALLATION
-- =====================================================
SELECT 'Database created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as lead_count FROM leads;
SELECT COUNT(*) as deal_count FROM deals;
