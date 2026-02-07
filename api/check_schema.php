<?php
// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config/database.php';

$database = new Database();
try {
    $db = $database->getConnection();
    echo "Connected successfully to " . ($database->isRemote() ? "REMOTE" : "LOCAL") . " database.\n\n";

    $tables = ['messages', 'transactions', 'error_logs', 'users'];
    foreach ($tables as $table) {
        echo "Checking columns for '$table':\n";
        try {
            $stmt = $db->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columns as $col) {
                echo "- " . $col['Field'] . " (" . $col['Type'] . ")\n";
            }
        } catch (Exception $e) {
            echo "Error describing $table: " . $e->getMessage() . "\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Database Connection Error: " . $e->getMessage();
}
