<?php
/**
 * Import schema to Railway database
 */

require_once __DIR__ . '/config/database.php';

echo "🚀 Importing schema to Railway...\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Read the schema file
    $schemaFile = __DIR__ . '/database/schema_railway.sql';
    if (!file_exists($schemaFile)) {
        die("❌ Schema file not found: $schemaFile\n");
    }
    
    $sql = file_get_contents($schemaFile);
    
    // Split by semicolons (but be careful with semicolons in strings)
    // Simple split for now - our schema is clean
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        function($s) { return !empty($s) && $s !== ''; }
    );
    
    $success = 0;
    $failed = 0;
    
    foreach ($statements as $statement) {
        // Skip comments
        if (strpos(trim($statement), '--') === 0 || empty(trim($statement))) {
            continue;
        }
        
        try {
            $db->exec($statement);
            
            // Extract table/action name for output
            if (preg_match('/CREATE TABLE.*?`?(\w+)`?/i', $statement, $m)) {
                echo "✅ Created table: {$m[1]}\n";
            } elseif (preg_match('/INSERT INTO.*?`?(\w+)`?/i', $statement, $m)) {
                echo "✅ Inserted into: {$m[1]}\n";
            } elseif (preg_match('/CREATE INDEX.*?ON.*?`?(\w+)`?/i', $statement, $m)) {
                echo "✅ Created index on: {$m[1]}\n";
            } else {
                echo "✅ Executed statement\n";
            }
            $success++;
        } catch (PDOException $e) {
            // Ignore "already exists" errors
            if (strpos($e->getMessage(), 'already exists') !== false) {
                echo "⏭️  Skipped (already exists)\n";
            } else {
                echo "❌ Error: " . $e->getMessage() . "\n";
                $failed++;
            }
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n";
    echo "📊 Summary: $success successful, $failed failed\n";
    
    // Verify tables
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "\n📋 Tables in database:\n";
    foreach ($tables as $table) {
        echo "   • $table\n";
    }
    
    echo "\n✅ Schema import complete!\n";
    
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
}
