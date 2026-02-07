<?php
/**
 * Setup Railway Database - Run this ONCE to create all tables
 */

echo "🚀 Setting up Railway Database...\n";
echo str_repeat("=", 50) . "\n\n";

// Railway credentials
$host = "hopper.proxy.rlwy.net";
$port = 45501;
$database = "railway";
$username = "root";
$password = "AgQKHIuBjfjqlbOibzQDfCUEYjqVSyKE";

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true
    ]);
    echo "✅ Connected to Railway!\n\n";
} catch (PDOException $e) {
    die("❌ Connection failed: " . $e->getMessage() . "\n");
}

// SQL statements to create tables
$statements = [
    "admins" => "CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
        is_active BOOLEAN DEFAULT TRUE,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    "categories" => "CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    "users" => "CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        bio TEXT,
        profile_image VARCHAR(255),
        location VARCHAR(100),
        coins INT DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_ratings INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        email_verified_at DATETIME,
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    
    "services" => "CREATE TABLE IF NOT EXISTS services (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        category_id INT,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price INT NOT NULL DEFAULT 0,
        duration VARCHAR(50),
        images JSON,
        tags JSON,
        status ENUM('active', 'inactive', 'pending', 'completed', 'reported', 'rejected', 'deleted', 'suspended') DEFAULT 'pending',
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        views INT DEFAULT 0,
        order_count INT UNSIGNED NOT NULL DEFAULT 0,
        rating_avg DECIMAL(3,2) DEFAULT 0.00,
        rating_count INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )",
    
    "demands" => "CREATE TABLE IF NOT EXISTS demands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        category_id INT,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        budget INT NOT NULL DEFAULT 0,
        status ENUM('open', 'in_progress', 'closed', 'fulfilled', 'deleted', 'expired') DEFAULT 'open',
        urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
        deadline DATETIME,
        location VARCHAR(200),
        attachments JSON,
        tags JSON,
        views INT UNSIGNED NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )",
    
    "transactions" => "CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        service_id INT,
        demand_id INT,
        from_user_id INT NOT NULL,
        to_user_id INT NOT NULL,
        coins INT NOT NULL,
        type ENUM('service_payment', 'demand_payment', 'bonus', 'refund', 'purchase') NOT NULL,
        status ENUM('pending', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE SET NULL,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    
    "messages" => "CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        service_id INT,
        demand_id INT,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        read_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
        FOREIGN KEY (demand_id) REFERENCES demands(id) ON DELETE SET NULL
    )",
    
    "report_types" => "CREATE TABLE IF NOT EXISTS report_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",
    
    "reports" => "CREATE TABLE IF NOT EXISTS reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reporter_id INT NOT NULL,
        report_type_id INT,
        reported_user_id INT,
        reported_service_id INT,
        reported_demand_id INT,
        reason TEXT NOT NULL,
        status ENUM('pending', 'reviewing', 'resolved', 'dismissed') DEFAULT 'pending',
        admin_notes TEXT,
        resolved_by INT,
        resolved_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (report_type_id) REFERENCES report_types(id) ON DELETE SET NULL,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_service_id) REFERENCES services(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_demand_id) REFERENCES demands(id) ON DELETE CASCADE,
        FOREIGN KEY (resolved_by) REFERENCES admins(id) ON DELETE SET NULL
    )",
    
    "ratings" => "CREATE TABLE IF NOT EXISTS ratings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        rater_id INT NOT NULL,
        rated_user_id INT NOT NULL,
        service_id INT,
        transaction_id INT,
        score INT NOT NULL CHECK (score >= 1 AND score <= 5),
        comment TEXT,
        is_anonymous BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
        UNIQUE KEY unique_rating (rater_id, rated_user_id, service_id)
    )",
    
    "notifications" => "CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        type ENUM('message', 'transaction', 'rating', 'report', 'system', 'service', 'demand') NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        reference_id INT,
        reference_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        read_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )"
];

// Create tables
echo "📦 Creating tables...\n";
foreach ($statements as $table => $sql) {
    try {
        $pdo->exec($sql);
        echo "   ✅ {$table}\n";
    } catch (PDOException $e) {
        echo "   ❌ {$table}: " . $e->getMessage() . "\n";
    }
}

// Create indexes
echo "\n📇 Creating indexes...\n";
$indexes = [
    "CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id)",
    "CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)",
    "CREATE INDEX IF NOT EXISTS idx_demands_user ON demands(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id)",
    "CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id)",
    "CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)",
    "CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)",
    "CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)",
    "CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)"
];

foreach ($indexes as $idx) {
    try {
        $pdo->exec($idx);
        echo "   ✅ Index created\n";
    } catch (PDOException $e) {
        // Ignore if exists
    }
}

// Insert default data
echo "\n📝 Inserting default data...\n";

// Default admin
try {
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $pdo->exec("INSERT IGNORE INTO admins (username, email, password, full_name, role) 
                VALUES ('admin', 'admin@swapie.com', '{$adminPassword}', 'System Admin', 'super_admin')");
    echo "   ✅ Default admin created (admin / admin123)\n";
} catch (PDOException $e) {
    echo "   ⏭️  Admin already exists\n";
}

// Default categories
$categories = [
    ['Technology', 'Tech services and support', 'laptop'],
    ['Design', 'Graphic and web design', 'palette'],
    ['Writing', 'Content writing and editing', 'edit'],
    ['Teaching', 'Tutoring and lessons', 'school'],
    ['Music', 'Music lessons and production', 'music_note'],
    ['Photography', 'Photo and video services', 'camera'],
    ['Fitness', 'Personal training and wellness', 'fitness_center'],
    ['Languages', 'Language lessons and translation', 'translate'],
    ['Crafts', 'Handmade items and repairs', 'build'],
    ['Other', 'Miscellaneous services', 'more_horiz']
];

foreach ($categories as $cat) {
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)");
        $stmt->execute($cat);
    } catch (PDOException $e) {
        // Ignore duplicates
    }
}
echo "   ✅ Default categories created\n";

// Default report types
$reportTypes = [
    ['Spam', 'Unwanted or repetitive content'],
    ['Inappropriate Content', 'Offensive or inappropriate material'],
    ['Scam/Fraud', 'Fraudulent or deceptive behavior'],
    ['Harassment', 'Bullying or harassment'],
    ['Fake Profile', 'Impersonation or fake account'],
    ['Other', 'Other violations']
];

foreach ($reportTypes as $rt) {
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO report_types (name, description) VALUES (?, ?)");
        $stmt->execute($rt);
    } catch (PDOException $e) {
        // Ignore duplicates
    }
}
echo "   ✅ Default report types created\n";

// Verify
echo "\n" . str_repeat("=", 50) . "\n";
echo "📋 Verifying tables...\n";
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "   Found " . count($tables) . " tables: " . implode(", ", $tables) . "\n";

echo "\n✅ DATABASE SETUP COMPLETE!\n";
echo "\n🔑 Default Admin Login:\n";
echo "   Username: admin\n";
echo "   Password: admin123\n";
