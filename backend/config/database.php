<?php
/**
 * Database Configuration
 * Swapie Admin Backend
 * 
 * =====================================================
 * TEAM SHARED DATABASE SETUP
 * =====================================================
 * 
 * For SHARED database (everyone sees same data):
 *   Set USE_REMOTE_DB = true and fill in remote credentials
 * 
 * For LOCAL database (your own data):
 *   Set USE_REMOTE_DB = false
 * =====================================================
 */

class Database {
    private $mode = 'hosting'; // 'local', 'remote', or 'hosting'
    
    // =====================================================
    // REMOTE DATABASE CREDENTIALS (e.g. Railway)
    // ===================================
    private $remoteHost = "hopper.proxy.rlwy.net";
    private $remoteDatabase = "railway";
    private $remoteUsername = "root";
    private $remotePassword = "AgQKHIuBjfjqlbOibzQDfCUEYjqVSyKE";
    private $remotePort = 45501;
    
    // =====================================================
    // INFINITYFREE / PRODUCTION DATABASE CREDENTIALS
    // =====================================================
    private $prodHost = "sqlXXX.infinityfree.com"; // Change this
    private $prodDatabase = "epiz_XXX_swapie";    // Change this
    private $prodUsername = "epiz_XXX";           // Change this
    private $prodPassword = "your_password";      // Change this
    private $prodPort = 3306;

    // =====================================================
    // LOCAL DATABASE CREDENTIALS
    // =====================================================
    private $localHost = "localhost";
    private $localDatabase = "swapie_db";
    private $localUsername = "root";
    private $localPassword = "";
    private $localPort = 3306;
 
    private $charset = "utf8mb4";
    public $conn;
    
    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;
        
        // Select credentials based on mode
        switch($this->mode) {
            case 'remote':
                $host = $this->remoteHost;
                $database = $this->remoteDatabase;
                $username = $this->remoteUsername;
                $password = $this->remotePassword;
                $port = $this->remotePort;
                break;
            case 'hosting':
                $host = $this->prodHost;
                $database = $this->prodDatabase;
                $username = $this->prodUsername;
                $password = $this->prodPassword;
                $port = $this->prodPort;
                break;
            case 'local':
            default:
                $host = $this->localHost;
                $database = $this->localDatabase;
                $username = $this->localUsername;
                $password = $this->localPassword;
                $port = $this->localPort;
                break;
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
            throw new Exception("Database connection failed: " . $this->mode);
        }
        
        return $this->conn;
    }
    
    /**
     * Check if using remote database
     * @return bool
     */
    public function isRemote() {
        return $this->mode === 'remote';
    }
}
