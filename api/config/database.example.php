<?php
/**
 * Database Configuration - EXAMPLE FILE
 * =====================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file and rename it to: database.php
 * 2. Choose your mode:
 *    - SHARED (team sees same data): Set useRemoteDb = true
 *    - LOCAL (your own data): Set useRemoteDb = false
 * 3. Fill in the appropriate credentials
 * 
 * FREE REMOTE DATABASE OPTIONS:
 * - PlanetScale: https://planetscale.com (MySQL, free tier)
 * - Railway: https://railway.app (MySQL, free tier)
 * - Clever Cloud: https://clever-cloud.com (MySQL, free tier)
 * - Aiven: https://aiven.io (MySQL, free tier)
 * 
 * Swapie Admin Backend
 */

class Database {
    // =====================================================
    // TOGGLE THIS: true = shared remote, false = local
    // =====================================================
    private $useRemoteDb = false;  // Change to true for shared database
    
    // =====================================================
    // REMOTE DATABASE CREDENTIALS (Shared with team)
    // Your team leader will give you these credentials
    // =====================================================
    private $remoteHost = "your-remote-host.com";      // e.g., "aws.connect.psdb.cloud"
    private $remoteDatabase = "swapie_db";              // Usually "swapie_db"
    private $remoteUsername = "your_remote_username";   // From your cloud provider
    private $remotePassword = "your_remote_password";   // From your cloud provider
    private $remotePort = 3306;                         // Usually 3306
    
    // =====================================================
    // LOCAL DATABASE CREDENTIALS (Your own machine)
    // =====================================================
    private $localHost = "localhost";    // Usually "localhost" or "127.0.0.1"
    private $localDatabase = "swapie_db"; // Keep this name
    private $localUsername = "root";      // Your MySQL username
    private $localPassword = "";          // Your MySQL password (empty for XAMPP default)
    private $localPort = 3306;            // Usually 3306
    
    // =====================================================
    // DO NOT MODIFY BELOW THIS LINE
    // =====================================================
    private $charset = "utf8mb4";
    public $conn;
    
    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;
        
        // Select credentials based on mode
        if ($this->useRemoteDb) {
            $host = $this->remoteHost;
            $database = $this->remoteDatabase;
            $username = $this->remoteUsername;
            $password = $this->remotePassword;
            $port = $this->remotePort;
        } else {
            $host = $this->localHost;
            $database = $this->localDatabase;
            $username = $this->localUsername;
            $password = $this->localPassword;
            $port = $this->localPort;
        }
        
        try {
            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 30,
            ];
            
            $this->conn = new PDO($dsn, $username, $password, $options);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            throw new Exception("Database connection failed: " . ($this->useRemoteDb ? "Remote" : "Local"));
        }
        
        return $this->conn;
    }
    
    /**
     * Check if using remote database
     * @return bool
     */
    public function isRemote() {
        return $this->useRemoteDb;
    }
}
