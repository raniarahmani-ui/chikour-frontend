<?php
require_once __DIR__ . '/config/database.php';

echo "🚀 Setting up LOCAL Database...\n";
echo str_repeat("=", 50) . "\n\n";

try {
    $database = new Database();
    $pdo = $database->getConnection();
    echo "✅ Connected to Local MySQL!\n\n";
} catch (Exception $e) {
    die("❌ Connection failed: " . $e->getMessage() . "\n");
}

// SQL statements to create tables (Adapted from setup_database.php)
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
        skills TEXT,
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

// Insert default categories
echo "\n📝 Inserting categories...\n";
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
    } catch (PDOException $e) {}
}
echo "   ✅ Done!\n";

echo "\n✅ LOCAL DATABASE SETUP COMPLETE!\n";
