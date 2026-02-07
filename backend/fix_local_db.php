<?php
$host = "127.0.0.1";
$user = "root";
$pass = "";

try {
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS swapie_db");
    $pdo->exec("USE swapie_db");

    // Ensure users table has skills column
    // First check if table exists (simple way)
    try {
        $pdo->query("SELECT skills FROM users LIMIT 1");
        echo "Skills column already exists.\n";
    } catch (Exception $e) {
        // Table might not exist or column might be missing
        // Let's check table existence
        $tableExists = $pdo->query("SHOW TABLES LIKE 'users'")->rowCount() > 0;
        if ($tableExists) {
            $pdo->exec("ALTER TABLE users ADD COLUMN skills TEXT AFTER bio");
            echo "Added skills column to existing users table.\n";
        } else {
            echo "Users table does not exist yet. Run setup_database.php first or wait for auth flow.\n";
        }
    }
    
    echo "Local setup check complete.\n";

} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
