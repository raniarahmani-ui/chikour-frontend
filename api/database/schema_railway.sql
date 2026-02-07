
SET FOREIGN_KEY_CHECKS = 0;

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
CREATE TABLE services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price INT NOT NULL DEFAULT 0,
    duration VARCHAR(50) NULL,
    images JSON NULL,
    tags JSON NULL,
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
CREATE TABLE demands (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget INT NULL,
    deadline DATE NULL,
    urgency ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    location VARCHAR(200) NULL,
    attachments JSON NULL,
    tags JSON NULL,
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

-- MESSAGES TABLE
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

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type VARCHAR(50) NOT NULL,
    category ENUM('info', 'success', 'warning', 'error', 'promotion') NOT NULL DEFAULT 'info',
    title VARCHAR(200) NOT NULL,
    message TEXT NULL,
    data JSON NULL,
    action_url VARCHAR(500) NULL,
    icon VARCHAR(100) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_type (type),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_created (created_at),
    INDEX idx_notification_user_unread (user_id, is_read),
    INDEX idx_notification_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- RATINGS TABLE
CREATE TABLE ratings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    transaction_id INT UNSIGNED NULL,
    rating TINYINT UNSIGNED NOT NULL,
    title VARCHAR(200) NULL,
    review TEXT NULL,
    pros TEXT NULL,
    cons TEXT NULL,
    images JSON NULL,
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
    INDEX idx_rating_created (created_at)
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

-- SERVICE REVIEWS TABLE (Legacy)
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
    INDEX idx_review_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- REPORTS TABLE
CREATE TABLE reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT UNSIGNED NOT NULL,
    report_type_id INT UNSIGNED NULL,
    reported_user_id INT UNSIGNED NULL,
    reported_service_id INT UNSIGNED NULL,
    reported_demand_id INT UNSIGNED NULL,
    reason VARCHAR(200) NOT NULL,
    description TEXT NULL,
    evidence JSON NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('pending', 'under_review', 'resolved', 'dismissed', 'escalated') NOT NULL DEFAULT 'pending',
    resolution_type ENUM('warning_issued', 'content_removed', 'user_suspended', 'user_banned', 'no_action', 'duplicate') NULL,
    admin_note TEXT NULL,
    internal_notes JSON NULL,
    assigned_to INT UNSIGNED NULL,
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
    INDEX idx_report_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    INDEX idx_error_created (created_at)
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

-- Default Admin (Password: password)
INSERT INTO admins (username, email, password, full_name, role, status) VALUES
('admin', 'admin@swapie.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'super_admin', 'active');

-- Default Categories
INSERT INTO categories (name, slug, description, icon, sort_order, status) VALUES
('Technology', 'technology', 'Technology and IT services', 'laptop', 1, 'active'),
('Design', 'design', 'Design and creative services', 'palette', 2, 'active'),
('Writing', 'writing', 'Writing and content creation', 'edit', 3, 'active'),
('Marketing', 'marketing', 'Marketing and promotion services', 'trending-up', 4, 'active'),
('Education', 'education', 'Educational and tutoring services', 'book-open', 5, 'active'),
('Business', 'business', 'Business and consulting services', 'briefcase', 6, 'active'),
('Lifestyle', 'lifestyle', 'Lifestyle and personal services', 'heart', 7, 'active'),
('Other', 'other', 'Other services', 'more-horizontal', 8, 'active');

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
('Other', 'other', 'Other issues not covered by above categories', 'all', 1, 99);

-- Default Settings
INSERT INTO settings (`key`, value, type, description) VALUES
('site_name', 'Swapie', 'string', 'Website name'),
('site_description', 'Service exchange platform', 'string', 'Website description'),
('maintenance_mode', '0', 'boolean', 'Enable maintenance mode'),
('registration_enabled', '1', 'boolean', 'Allow new user registrations'),
('email_verification_required', '1', 'boolean', 'Require email verification'),
('default_coin_balance', '100', 'number', 'Default coins for new users'),
('platform_fee_percentage', '10', 'number', 'Platform fee percentage'),
('min_withdrawal_amount', '50', 'number', 'Minimum withdrawal amount');

SELECT '✅ Database setup complete!' AS status;
SELECT 'Admin Login: admin@swapie.com / password' AS info;
