<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Checking for missing columns in 'users' table...\n";
    
    $colsToAdd = [
        'reset_code_hash' => "VARCHAR(255) DEFAULT NULL",
        'reset_code_expires' => "DATETIME DEFAULT NULL"
    ];

    foreach ($colsToAdd as $col => $definition) {
        $check = $db->query("SHOW COLUMNS FROM users LIKE '$col'");
        if ($check->rowCount() == 0) {
            echo "Adding column '$col'...\n";
            $db->exec("ALTER TABLE users ADD $col $definition");
            echo "✅ Column '$col' added.\n";
        } else {
            echo "ℹ️ Column '$col' already exists.\n";
        }
    }

    echo "Done!\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
