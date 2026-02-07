<?php
require_once __DIR__ . '/config/database.php';
$database = new Database();
$db = $database->getConnection();

try {
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT AFTER bio");
    echo "Success: Added skills column";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
