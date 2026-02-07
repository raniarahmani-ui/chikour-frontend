-- =====================================================
-- SWAPIE DATABASE - COMPLETE SCHEMA
-- =====================================================
-- Version: 2.0
-- Last Updated: February 2, 2026
-- =====================================================
-- 
-- SETUP INSTRUCTIONS FOR NEW TEAM MEMBERS:
-- 1. Install MySQL/XAMPP/WAMP
-- 2. Open phpMyAdmin or MySQL terminal
-- 3. Run this entire file: SOURCE schema.sql
-- 4. Copy database.example.php to database.php
-- 5. Update database.php with YOUR credentials
--
-- Default Admin Login:
--   Email: admin@swapie.com
--   Password: password
-- =====================================================

CREATE DATABASE IF NOT EXISTS swapie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE swapie_db;

-- =====================================================
-- DISABLE FOREIGN KEY CHECKS FOR CLEAN SETUP
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- DROP ALL EXISTING TABLES (for fresh install)
-- =====================================================
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS rating_helpful_votes;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS report_types;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS service_reviews;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS demands;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin_activity_logs;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS settings;

SET FOREIGN_KEY_CHECKS = 1;

-- ADMINS TABLE

CREATE TABLE admins (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) NULL,
    role ENUM('super_admin', 'admin', 'moderator') NOT NULL DEFAULT 'admin',
    status ENUM('active', 'inactive', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    last_login DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_admin_username (username),
    UNIQUE KEY uk_admin_email (email),
    INDEX idx_admin_status (status),
    INDEX idx_admin_role (role),
    INDEX idx_admin_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ADMIN ACTIVITY LOGS TABLE
-- Tracks all admin actions for audit
CREATE TABLE admin_activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT UNSIGNED NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_log_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_log_admin (admin_id),
    INDEX idx_log_entity (entity_type, entity_id),
    INDEX idx_log_action (action),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- USERS TABLE

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    avatar VARCHAR(255) NULL,
    bio TEXT NULL,
    status ENUM('active', 'inactive', 'suspended', 'banned', 'deleted') NOT NULL DEFAULT 'active',
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    phone_verified TINYINT(1) NOT NULL DEFAULT 0,
    coin_balance INT NOT NULL DEFAULT 0,
    total_earned INT NOT NULL DEFAULT 0,
    total_spent INT NOT NULL DEFAULT 0,
    rating_avg DECIMAL(3,2) NULL DEFAULT 0.00,
    rating_count INT NOT NULL DEFAULT 0,
    reset_code_hash VARCHAR(255) NULL,
    reset_code_expires DATETIME NULL,
    last_login DATETIME NULL,
    last_active DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_username (username),
    UNIQUE KEY uk_user_email (email),
    INDEX idx_user_status (status),
    INDEX idx_user_email_verified (email_verified),
    INDEX idx_user_created (created_at),
    INDEX idx_user_rating (rating_avg),
    INDEX idx_user_last_active (last_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CATEGORIES TABLE

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(100) NULL,
    image VARCHAR(255) NULL,
    parent_id INT UNSIGNED NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status ENUM('active', 'inactive', 'deleted') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_category_slug (slug),
    INDEX idx_category_parent (parent_id),
    INDEX idx_category_status (status),
    INDEX idx_category_sort (sort_order),
    CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SERVICES TABLE
DROP TABLE IF EXISTS services;

CREATE TABLE services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price INT NOT NULL DEFAULT 0,
    duration VARCHAR(50) NULL COMMENT 'Expected delivery time',
    images JSON NULL COMMENT 'Array of image URLs',
    tags JSON NULL COMMENT 'Array of tags',
    status ENUM('active', 'inactive', 'pending', 'rejected', 'deleted') NOT NULL DEFAULT 'pending',
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    order_count INT UNSIGNED NOT NULL DEFAULT 0,
    rating_avg DECIMAL(3,2) NULL DEFAULT 0.00,
    rating_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_service_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_service_user (user_id),
    INDEX idx_service_category (category_id),
    INDEX idx_service_status (status),
    INDEX idx_service_featured (is_featured),
    INDEX idx_service_created (created_at),
    INDEX idx_service_price (price),
    INDEX idx_service_rating (rating_avg),
    FULLTEXT INDEX ftx_service_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DEMANDS TABLE
DROP TABLE IF EXISTS demands;

CREATE TABLE demands (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget INT NULL COMMENT 'Budget in coins',
    deadline DATE NULL,
    urgency ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    location VARCHAR(200) NULL,
    attachments JSON NULL COMMENT 'Array of attachment URLs',
    tags JSON NULL COMMENT 'Array of tags',
    status ENUM('open', 'in_progress', 'completed', 'closed', 'cancelled', 'deleted') NOT NULL DEFAULT 'open',
    views INT UNSIGNED NOT NULL DEFAULT 0,
    proposal_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_demand_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_demand_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_demand_user (user_id),
    INDEX idx_demand_category (category_id),
    INDEX idx_demand_status (status),
    INDEX idx_demand_urgency (urgency),
    INDEX idx_demand_deadline (deadline),
    INDEX idx_demand_created (created_at),
    FULLTEXT INDEX ftx_demand_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TRANSACTIONS TABLE

CREATE TABLE transactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('purchase', 'earning', 'withdrawal', 'refund', 'adjustment', 'bonus') NOT NULL,
    amount INT NOT NULL,
    fee INT NOT NULL DEFAULT 0,
    service_id INT UNSIGNED NULL,
    demand_id INT UNSIGNED NULL,
    reference_id VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NULL,
    description TEXT NULL,
    metadata JSON NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    processed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_transaction_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    CONSTRAINT fk_transaction_demand FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE SET NULL,
    UNIQUE KEY uk_transaction_reference (reference_id),
    INDEX idx_transaction_user (user_id),
    INDEX idx_transaction_type (type),
    INDEX idx_transaction_status (status),
    INDEX idx_transaction_service (service_id),
    INDEX idx_transaction_demand (demand_id),
    INDEX idx_transaction_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMMUNICATION TABLES
-- =====================================================

-- MESSAGES TABLE (Chat System)
CREATE TABLE messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id INT UNSIGNED NOT NULL,
    receiver_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED NULL,
    demand_id INT UNSIGNED NULL,
    message TEXT NOT NULL,
    attachments JSON NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    CONSTRAINT fk_message_demand FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE SET NULL,
    INDEX idx_message_sender (sender_id),
    INDEX idx_message_receiver (receiver_id),
    INDEX idx_message_conversation (sender_id, receiver_id),
    INDEX idx_message_created (created_at),
    INDEX idx_message_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTIFICATIONS TABLE (Enhanced)
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'message, transaction, service, demand, report, rating, system, promotion',
    category ENUM('info', 'success', 'warning', 'error', 'promotion') NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NULL,
    data JSON NULL COMMENT 'Additional data like IDs, links, etc.',
    action_url VARCHAR(500) NULL COMMENT 'URL to redirect when clicked',
    icon VARCHAR(100) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    expires_at DATETIME NULL COMMENT 'Auto-delete after this date',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_type (type),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at),
    INDEX idx_notification_user_unread (user_id, is_read),
    INDEX idx_notification_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RATING & REVIEW TABLES
-- =====================================================

-- RATINGS TABLE (Enhanced Reviews)
CREATE TABLE ratings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL COMMENT 'User who gave the rating',
    transaction_id INT UNSIGNED NULL COMMENT 'Link to completed transaction for verified purchase',
    rating TINYINT UNSIGNED NOT NULL COMMENT '1-5 stars',
    title VARCHAR(200) NULL,
    review TEXT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    images JSON NULL COMMENT 'Review images',
    is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
    not_helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
    provider_response TEXT NULL,
    provider_response_at DATETIME NULL,
    status ENUM('active', 'hidden', 'pending', 'deleted') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_rating_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    UNIQUE KEY uk_rating_user_service (user_id, service_id),
    INDEX idx_rating_service (service_id),
    INDEX idx_rating_user (user_id),
    INDEX idx_rating_value (rating),
    INDEX idx_rating_status (status),
    INDEX idx_rating_featured (is_featured),
    INDEX idx_rating_verified (is_verified_purchase),
    INDEX idx_rating_created (created_at),
    CONSTRAINT chk_rating_value CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RATING HELPFUL VOTES TABLE
CREATE TABLE rating_helpful_votes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rating_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    is_helpful TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_vote_rating FOREIGN KEY (rating_id) REFERENCES ratings(id) ON DELETE CASCADE,
    CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_vote_user_rating (user_id, rating_id),
    INDEX idx_vote_rating (rating_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SERVICE REVIEWS TABLE (Legacy - kept for compatibility)
CREATE TABLE service_reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    status ENUM('active', 'hidden', 'deleted') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_review_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_review (service_id, user_id),
    INDEX idx_review_service (service_id),
    INDEX idx_review_user (user_id),
    INDEX idx_review_rating (rating),
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- REPORT SYSTEM TABLES
-- =====================================================

-- REPORT TYPES TABLE
CREATE TABLE report_types (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT NULL,
    entity_type ENUM('user', 'service', 'demand', 'all') NOT NULL DEFAULT 'all',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_report_type_slug (slug),
    INDEX idx_report_type_active (is_active),
    INDEX idx_report_type_entity (entity_type),
    INDEX idx_report_type_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REPORTS TABLE (Enhanced)
CREATE TABLE reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT UNSIGNED NOT NULL,
    report_type_id INT UNSIGNED NULL,
    reported_user_id INT UNSIGNED NULL,
    reported_service_id INT UNSIGNED NULL,
    reported_demand_id INT UNSIGNED NULL,
    reason VARCHAR(200) NOT NULL,
    description TEXT NULL,
    evidence JSON NULL COMMENT 'Screenshots, links, etc.',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'under_review', 'resolved', 'dismissed', 'escalated') NOT NULL DEFAULT 'pending',
    resolution_type ENUM('warning_issued', 'content_removed', 'user_suspended', 'user_banned', 'no_action', 'duplicate') NULL,
    admin_note TEXT NULL,
    internal_notes JSON NULL COMMENT 'Internal admin notes history',
    assigned_to INT UNSIGNED NULL COMMENT 'Assigned admin',
    resolved_by INT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_type FOREIGN KEY (report_type_id) REFERENCES report_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_user FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_service FOREIGN KEY (reported_service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_demand FOREIGN KEY (reported_demand_id) REFERENCES demands(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_assigned FOREIGN KEY (assigned_to) REFERENCES admins(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_admin FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_report_reporter (reporter_id),
    INDEX idx_report_status (status),
    INDEX idx_report_priority (priority),
    INDEX idx_report_type (report_type_id),
    INDEX idx_report_user (reported_user_id),
    INDEX idx_report_service (reported_service_id),
    INDEX idx_report_demand (reported_demand_id),
    INDEX idx_report_created (created_at),
    INDEX idx_report_status_priority (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

-- ERROR LOGS TABLE
CREATE TABLE error_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_code VARCHAR(50) NULL,
    file VARCHAR(500) NULL,
    line INT NULL,
    trace TEXT NULL,
    request_uri VARCHAR(500) NULL,
    request_method VARCHAR(10) NULL,
    request_data JSON NULL,
    user_id INT UNSIGNED NULL,
    admin_id INT UNSIGNED NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    severity ENUM('debug', 'info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'error',
    is_resolved TINYINT(1) NOT NULL DEFAULT 0,
    resolved_by INT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    resolution_note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_error_type (error_type),
    INDEX idx_error_severity (severity),
    INDEX idx_error_resolved (is_resolved),
    INDEX idx_error_created (created_at),
    INDEX idx_error_user (user_id),
    INDEX idx_error_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SETTINGS TABLE
CREATE TABLE settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL,
    value TEXT NULL,
    type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description VARCHAR(255) NULL,
    updated_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_setting_key (`key`),
    CONSTRAINT fk_setting_admin FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMPOSITE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_services_status_category ON services(status, category_id);
CREATE INDEX idx_demands_status_category ON demands(status, category_id);
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_transactions_date_status ON transactions(created_at, status);


-- INSERT DEFAULT DATA
-- Default Admin (Password: password)
INSERT INTO admins (username, email, password, full_name, role, status) VALUES
('admin', 'admin@swapie.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Default Categories
INSERT INTO categories (name, slug, description, icon, sort_order, status) VALUES
('Technology', 'technology', 'Technology and IT services', 'laptop', 1, 'active'),
('Design', 'design', 'Design and creative services', 'palette', 2, 'active'),
('Writing', 'writing', 'Writing and content creation', 'edit', 3, 'active'),
('Marketing', 'marketing', 'Marketing and promotion services', 'trending-up', 4, 'active'),
('Education', 'education', 'Educational and tutoring services', 'book-open', 5, 'active'),
('Business', 'business', 'Business and consulting services', 'briefcase', 6, 'active'),
('Lifestyle', 'lifestyle', 'Lifestyle and personal services', 'heart', 7, 'active'),
('Other', 'other', 'Other services', 'more-horizontal', 8, 'active')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Subcategories for Technology
INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, status)
SELECT 'Web Development', 'web-development', 'Website and web application development', 'code', id, 1, 'active'
FROM categories WHERE slug = 'technology'
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, status)
SELECT 'Mobile Development', 'mobile-development', 'Mobile app development for iOS and Android', 'smartphone', id, 2, 'active'
FROM categories WHERE slug = 'technology'
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, status)
SELECT 'Data Science', 'data-science', 'Data analysis and machine learning', 'database', id, 3, 'active'
FROM categories WHERE slug = 'technology'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Subcategories for Design
INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, status)
SELECT 'Logo Design', 'logo-design', 'Logo and brand identity design', 'image', id, 1, 'active'
FROM categories WHERE slug = 'design'
ON DUPLICATE KEY UPDATE updated_at = NOW();

INSERT INTO categories (name, slug, description, icon, parent_id, sort_order, status)
SELECT 'UI/UX Design', 'ui-ux-design', 'User interface and experience design', 'layout', id, 2, 'active'
FROM categories WHERE slug = 'design'
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Default Settings
INSERT INTO settings (`key`, value, type, description) VALUES
('site_name', 'Swapie', 'string', 'Website name'),
('site_description', 'Service exchange platform', 'string', 'Website description'),
('maintenance_mode', '0', 'boolean', 'Enable maintenance mode'),
('registration_enabled', '1', 'boolean', 'Allow new user registrations'),
('email_verification_required', '1', 'boolean', 'Require email verification'),
('default_coin_balance', '100', 'number', 'Default coins for new users'),
('platform_fee_percentage', '10', 'number', 'Platform fee percentage'),
('min_withdrawal_amount', '50', 'number', 'Minimum withdrawal amount')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Default Report Types
INSERT INTO report_types (name, slug, description, entity_type, is_active, sort_order) VALUES
('Spam', 'spam', 'Unwanted promotional content or repetitive messages', 'all', 1, 1),
('Harassment', 'harassment', 'Bullying, threats, or abusive behavior', 'all', 1, 2),
('Fraud', 'fraud', 'Scam, fake service, or deceptive practices', 'all', 1, 3),
('Inappropriate Content', 'inappropriate-content', 'Offensive, explicit, or inappropriate material', 'all', 1, 4),
('Copyright Violation', 'copyright-violation', 'Unauthorized use of copyrighted material', 'service', 1, 5),
('Fake Profile', 'fake-profile', 'Impersonation or fake identity', 'user', 1, 6),
('Poor Quality', 'poor-quality', 'Service did not meet described standards', 'service', 1, 7),
('Non-Delivery', 'non-delivery', 'Service was not delivered as promised', 'service', 1, 8),
('Other', 'other', 'Other issues not covered by above categories', 'all', 1, 99)
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- =====================================================
-- VIEWS
-- =====================================================

-- Active services with user and category info
CREATE OR REPLACE VIEW v_active_services AS
SELECT 
    s.*,
    u.username,
    u.full_name as provider_name,
    u.avatar as provider_avatar,
    u.rating_avg as provider_rating,
    c.name as category_name,
    c.slug as category_slug
FROM services s
JOIN users u ON s.user_id = u.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.status = 'active' AND u.status = 'active';

-- Active demands with user and category info
CREATE OR REPLACE VIEW v_active_demands AS
SELECT 
    d.*,
    u.username,
    u.full_name as requester_name,
    u.avatar as requester_avatar,
    c.name as category_name,
    c.slug as category_slug
FROM demands d
JOIN users u ON d.user_id = u.id
LEFT JOIN categories c ON d.category_id = c.id
WHERE d.status = 'open' AND u.status = 'active';

-- Daily transaction summary
CREATE OR REPLACE VIEW v_daily_transactions AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_volume,
    SUM(CASE WHEN status = 'completed' THEN fee ELSE 0 END) as total_fees,
    AVG(CASE WHEN status = 'completed' THEN amount END) as avg_amount
FROM transactions
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Category statistics
CREATE OR REPLACE VIEW v_category_stats AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.icon,
    c.parent_id,
    (SELECT COUNT(*) FROM services WHERE category_id = c.id AND status = 'active') as service_count,
    (SELECT COUNT(*) FROM demands WHERE category_id = c.id AND status = 'open') as demand_count,
    (SELECT COUNT(*) FROM categories WHERE parent_id = c.id AND status = 'active') as subcategory_count
FROM categories c
WHERE c.status = 'active';

-- Ratings with details view
CREATE OR REPLACE VIEW v_ratings_detailed AS
SELECT 
    r.*,
    u.username as reviewer_username,
    u.full_name as reviewer_name,
    u.avatar as reviewer_avatar,
    s.title as service_title,
    s.user_id as provider_id,
    pu.username as provider_username
FROM ratings r
JOIN users u ON r.user_id = u.id
JOIN services s ON r.service_id = s.id
JOIN users pu ON s.user_id = pu.id
WHERE r.status = 'active';

-- Reports with details view
CREATE OR REPLACE VIEW v_reports_detailed AS
SELECT 
    r.*,
    rt.name as report_type_name,
    reporter.username as reporter_username,
    reported_user.username as reported_username,
    s.title as reported_service_title,
    d.title as reported_demand_title,
    resolver.username as resolved_by_username
FROM reports r
LEFT JOIN report_types rt ON r.report_type_id = rt.id
JOIN users reporter ON r.reporter_id = reporter.id
LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
LEFT JOIN services s ON r.reported_service_id = s.id
LEFT JOIN demands d ON r.reported_demand_id = d.id
LEFT JOIN admins resolver ON r.resolved_by = resolver.id;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update service rating when service review is added (legacy)
DELIMITER //
CREATE TRIGGER tr_update_service_rating AFTER INSERT ON service_reviews
FOR EACH ROW
BEGIN
    UPDATE services 
    SET rating_avg = (SELECT AVG(rating) FROM service_reviews WHERE service_id = NEW.service_id AND status = 'active'),
        rating_count = (SELECT COUNT(*) FROM service_reviews WHERE service_id = NEW.service_id AND status = 'active')
    WHERE id = NEW.service_id;
END//
DELIMITER ;

-- Update service and provider ratings when new rating is added
DELIMITER //
CREATE TRIGGER tr_rating_after_insert AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
    DECLARE v_provider_id INT UNSIGNED;
    
    -- Update service ratings
    UPDATE services 
    SET rating_avg = (SELECT AVG(rating) FROM ratings WHERE service_id = NEW.service_id AND status = 'active'),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE service_id = NEW.service_id AND status = 'active')
    WHERE id = NEW.service_id;
    
    -- Get provider ID and update their rating
    SELECT user_id INTO v_provider_id FROM services WHERE id = NEW.service_id;
    
    UPDATE users 
    SET rating_avg = (
        SELECT AVG(r.rating) 
        FROM ratings r 
        JOIN services s ON r.service_id = s.id 
        WHERE s.user_id = v_provider_id AND r.status = 'active'
    ),
    rating_count = (
        SELECT COUNT(*) 
        FROM ratings r 
        JOIN services s ON r.service_id = s.id 
        WHERE s.user_id = v_provider_id AND r.status = 'active'
    )
    WHERE id = v_provider_id;
END//
DELIMITER ;

-- Update ratings when rating is updated
DELIMITER //
CREATE TRIGGER tr_rating_after_update AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
    DECLARE v_provider_id INT UNSIGNED;
    
    IF OLD.rating != NEW.rating OR OLD.status != NEW.status THEN
        UPDATE services 
        SET rating_avg = (SELECT AVG(rating) FROM ratings WHERE service_id = NEW.service_id AND status = 'active'),
            rating_count = (SELECT COUNT(*) FROM ratings WHERE service_id = NEW.service_id AND status = 'active')
        WHERE id = NEW.service_id;
        
        SELECT user_id INTO v_provider_id FROM services WHERE id = NEW.service_id;
        
        UPDATE users 
        SET rating_avg = (
            SELECT AVG(r.rating) 
            FROM ratings r 
            JOIN services s ON r.service_id = s.id 
            WHERE s.user_id = v_provider_id AND r.status = 'active'
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM ratings r 
            JOIN services s ON r.service_id = s.id 
            WHERE s.user_id = v_provider_id AND r.status = 'active'
        )
        WHERE id = v_provider_id;
    END IF;
END//
DELIMITER ;

-- Update ratings when rating is deleted
DELIMITER //
CREATE TRIGGER tr_rating_after_delete AFTER DELETE ON ratings
FOR EACH ROW
BEGIN
    DECLARE v_provider_id INT UNSIGNED;
    
    UPDATE services 
    SET rating_avg = COALESCE((SELECT AVG(rating) FROM ratings WHERE service_id = OLD.service_id AND status = 'active'), 0),
        rating_count = (SELECT COUNT(*) FROM ratings WHERE service_id = OLD.service_id AND status = 'active')
    WHERE id = OLD.service_id;
    
    SELECT user_id INTO v_provider_id FROM services WHERE id = OLD.service_id;
    
    IF v_provider_id IS NOT NULL THEN
        UPDATE users 
        SET rating_avg = COALESCE((
            SELECT AVG(r.rating) 
            FROM ratings r 
            JOIN services s ON r.service_id = s.id 
            WHERE s.user_id = v_provider_id AND r.status = 'active'
        ), 0),
        rating_count = (
            SELECT COUNT(*) 
            FROM ratings r 
            JOIN services s ON r.service_id = s.id 
            WHERE s.user_id = v_provider_id AND r.status = 'active'
        )
        WHERE id = v_provider_id;
    END IF;
END//
DELIMITER ;

-- Update helpful counts when vote is added
DELIMITER //
CREATE TRIGGER tr_helpful_vote_insert AFTER INSERT ON rating_helpful_votes
FOR EACH ROW
BEGIN
    IF NEW.is_helpful = 1 THEN
        UPDATE ratings SET helpful_count = helpful_count + 1 WHERE id = NEW.rating_id;
    ELSE
        UPDATE ratings SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.rating_id;
    END IF;
END//
DELIMITER ;

-- Update helpful counts when vote is changed
DELIMITER //
CREATE TRIGGER tr_helpful_vote_update AFTER UPDATE ON rating_helpful_votes
FOR EACH ROW
BEGIN
    IF OLD.is_helpful != NEW.is_helpful THEN
        IF NEW.is_helpful = 1 THEN
            UPDATE ratings SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.rating_id;
        ELSE
            UPDATE ratings SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.rating_id;
        END IF;
    END IF;
END//
DELIMITER ;

-- Update helpful counts when vote is removed
DELIMITER //
CREATE TRIGGER tr_helpful_vote_delete AFTER DELETE ON rating_helpful_votes
FOR EACH ROW
BEGIN
    IF OLD.is_helpful = 1 THEN
        UPDATE ratings SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = OLD.rating_id;
    ELSE
        UPDATE ratings SET not_helpful_count = GREATEST(not_helpful_count - 1, 0) WHERE id = OLD.rating_id;
    END IF;
END//
DELIMITER ;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to transfer coins between users
DELIMITER //
CREATE PROCEDURE sp_transfer_coins(
    IN p_from_user_id INT UNSIGNED,
    IN p_to_user_id INT UNSIGNED,
    IN p_amount INT,
    IN p_fee INT,
    IN p_service_id INT UNSIGNED,
    IN p_demand_id INT UNSIGNED,
    IN p_description TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    DECLARE v_from_balance INT;
    DECLARE v_reference VARCHAR(50);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Transaction failed due to database error';
    END;
    
    START TRANSACTION;
    
    -- Check sender balance
    SELECT coin_balance INTO v_from_balance FROM users WHERE id = p_from_user_id FOR UPDATE;
    
    IF v_from_balance < (p_amount + p_fee) THEN
        SET p_success = FALSE;
        SET p_message = 'Insufficient balance';
        ROLLBACK;
    ELSE
        -- Generate reference
        SET v_reference = CONCAT('TXN', UPPER(HEX(RANDOM_BYTES(8))));
        
        -- Deduct from sender
        UPDATE users SET coin_balance = coin_balance - (p_amount + p_fee), total_spent = total_spent + p_amount WHERE id = p_from_user_id;
        
        -- Add to receiver
        UPDATE users SET coin_balance = coin_balance + p_amount, total_earned = total_earned + p_amount WHERE id = p_to_user_id;
        
        -- Create transaction records
        INSERT INTO transactions (user_id, type, amount, fee, service_id, demand_id, reference_id, description, status, processed_at)
        VALUES (p_from_user_id, 'purchase', p_amount, p_fee, p_service_id, p_demand_id, v_reference, p_description, 'completed', NOW());
        
        INSERT INTO transactions (user_id, type, amount, fee, service_id, demand_id, reference_id, description, status, processed_at)
        VALUES (p_to_user_id, 'earning', p_amount, 0, p_service_id, p_demand_id, CONCAT(v_reference, '-E'), p_description, 'completed', NOW());
        
        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Transfer completed successfully';
    END IF;
END//
DELIMITER ;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
SELECT '✅ Database setup complete!' AS status;
SELECT 'Default Admin: admin@swapie.com / password' AS info;
