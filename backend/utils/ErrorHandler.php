<?php
/**
 * Error Handler Utility
 * Centralized error handling for the backend
 * Logs errors and provides consistent error responses
 */

class ErrorHandler {
    private static $db = null;
    private static $initialized = false;
    
    // Error severity levels
    const SEVERITY_DEBUG = 'debug';
    const SEVERITY_INFO = 'info';
    const SEVERITY_NOTICE = 'notice';
    const SEVERITY_WARNING = 'warning';
    const SEVERITY_ERROR = 'error';
    const SEVERITY_CRITICAL = 'critical';
    const SEVERITY_ALERT = 'alert';
    const SEVERITY_EMERGENCY = 'emergency';
    
    /**
     * Initialize error handler
     * @param PDO|null $db Database connection for logging
     */
    public static function init($db = null) {
        if (self::$initialized) {
            return;
        }
        
        self::$db = $db;
        
        // Set error handlers
        set_error_handler([self::class, 'handleError']);
        set_exception_handler([self::class, 'handleException']);
        register_shutdown_function([self::class, 'handleShutdown']);
        
        self::$initialized = true;
    }
    
    /**
     * Set database connection for logging
     * @param PDO $db
     */
    public static function setDatabase($db) {
        self::$db = $db;
    }
    
    /**
     * Handle PHP errors
     */
    public static function handleError($errno, $errstr, $errfile, $errline) {
        // Don't handle suppressed errors
        if (!(error_reporting() & $errno)) {
            return false;
        }
        
        $severity = self::mapErrorSeverity($errno);
        $errorType = self::getErrorTypeName($errno);
        
        // Log the error
        self::logError([
            'error_type' => $errorType,
            'message' => $errstr,
            'file' => $errfile,
            'line' => $errline,
            'severity' => $severity
        ]);
        
        // For fatal errors, send response
        if (in_array($errno, [E_ERROR, E_USER_ERROR, E_CORE_ERROR, E_COMPILE_ERROR])) {
            self::sendErrorResponse(
                'An internal error occurred',
                500,
                self::isDebugMode() ? [
                    'type' => $errorType,
                    'message' => $errstr,
                    'file' => $errfile,
                    'line' => $errline
                ] : null
            );
        }
        
        // Return true to prevent PHP's internal error handler
        return true;
    }
    
    /**
     * Handle uncaught exceptions
     */
    public static function handleException($exception) {
        $severity = self::SEVERITY_ERROR;
        
        // Determine severity based on exception type
        if ($exception instanceof PDOException) {
            $severity = self::SEVERITY_CRITICAL;
        }
        
        // Log the exception
        self::logError([
            'error_type' => get_class($exception),
            'error_code' => $exception->getCode(),
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'severity' => $severity
        ]);
        
        // Send error response
        $statusCode = self::getHttpStatusFromException($exception);
        $message = self::getPublicMessage($exception);
        
        self::sendErrorResponse(
            $message,
            $statusCode,
            self::isDebugMode() ? [
                'type' => get_class($exception),
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine()
            ] : null
        );
    }
    
    /**
     * Handle fatal errors on shutdown
     */
    public static function handleShutdown() {
        $error = error_get_last();
        
        if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
            self::logError([
                'error_type' => self::getErrorTypeName($error['type']),
                'message' => $error['message'],
                'file' => $error['file'],
                'line' => $error['line'],
                'severity' => self::SEVERITY_CRITICAL
            ]);
            
            // Only send response if headers haven't been sent
            if (!headers_sent()) {
                self::sendErrorResponse('A fatal error occurred', 500);
            }
        }
    }
    
    /**
     * Handle exception directly (can be called from catch blocks)
     * @param Exception $e
     * @param bool $exitAfter Whether to exit after handling
     */
    public static function handle($e, $exitAfter = true) {
        self::handleException($e);
        if ($exitAfter) {
            exit;
        }
    }
    
    /**
     * Log error to database and file
     */
    private static function logError($data) {
        // Always log to file
        self::logToFile($data);
        
        // Log to database if connection available
        if (self::$db) {
            self::logToDatabase($data);
        }
    }
    
    /**
     * Log error to file
     */
    private static function logToFile($data) {
        $logDir = __DIR__ . '/../logs';
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        $logFile = $logDir . '/error_' . date('Y-m-d') . '.log';
        
        $logEntry = sprintf(
            "[%s] [%s] [%s] %s in %s:%d\n%s\n%s\n",
            date('Y-m-d H:i:s'),
            strtoupper($data['severity'] ?? 'error'),
            $data['error_type'] ?? 'Unknown',
            $data['message'] ?? 'No message',
            $data['file'] ?? 'Unknown',
            $data['line'] ?? 0,
            isset($data['trace']) ? "Stack trace:\n" . $data['trace'] : '',
            str_repeat('-', 80)
        );
        
        error_log($logEntry, 3, $logFile);
    }
    
    /**
     * Log error to database
     */
    private static function logToDatabase($data) {
        try {
            // Check if error_logs table exists
            $tableCheck = self::$db->query("SHOW TABLES LIKE 'error_logs'");
            if ($tableCheck->rowCount() === 0) {
                return; // Table doesn't exist, skip database logging
            }
            
            $query = "INSERT INTO error_logs 
                      (error_code, error_type, error_message, file, line, trace, 
                       request_uri, request_method, request_data, 
                       ip_address, user_agent, severity, created_at)
                      VALUES 
                      (:error_code, :error_type, :error_message, :file, :line, :trace,
                       :request_uri, :request_method, :request_data,
                       :ip_address, :user_agent, :severity, NOW())";
            
            $stmt = self::$db->prepare($query);
            $stmt->execute([
                'error_code' => $data['error_code'] ?? null,
                'error_type' => $data['error_type'] ?? 'Unknown',
                'error_message' => $data['message'] ?? 'No message',
                'file' => $data['file'] ?? null,
                'line' => $data['line'] ?? null,
                'trace' => $data['trace'] ?? null,
                'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? null,
                'request_data' => json_encode(self::getRequestData()),
                'ip_address' => self::getClientIp(),
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'severity' => $data['severity'] ?? self::SEVERITY_ERROR
            ]);
        } catch (Exception $e) {
            // If database logging fails, log to file
            error_log("Failed to log error to database: " . $e->getMessage());
        }
    }
    
    /**
     * Send error response to client
     */
    private static function sendErrorResponse($message, $statusCode = 500, $debug = null) {
        // Clear any previous output
        if (ob_get_length()) {
            ob_clean();
        }
        
        http_response_code($statusCode);
        header('Content-Type: application/json');
        
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $statusCode,
            'timestamp' => date('c')
        ];
        
        if ($debug && self::isDebugMode()) {
            $response['debug'] = $debug;
        }
        
        echo json_encode($response);
        exit;
    }
    
    /**
     * Map PHP error constants to severity levels
     */
    private static function mapErrorSeverity($errno) {
        $map = [
            E_ERROR => self::SEVERITY_CRITICAL,
            E_WARNING => self::SEVERITY_WARNING,
            E_PARSE => self::SEVERITY_CRITICAL,
            E_NOTICE => self::SEVERITY_NOTICE,
            E_CORE_ERROR => self::SEVERITY_CRITICAL,
            E_CORE_WARNING => self::SEVERITY_WARNING,
            E_COMPILE_ERROR => self::SEVERITY_CRITICAL,
            E_COMPILE_WARNING => self::SEVERITY_WARNING,
            E_USER_ERROR => self::SEVERITY_ERROR,
            E_USER_WARNING => self::SEVERITY_WARNING,
            E_USER_NOTICE => self::SEVERITY_NOTICE,
            E_STRICT => self::SEVERITY_DEBUG,
            E_RECOVERABLE_ERROR => self::SEVERITY_ERROR,
            E_DEPRECATED => self::SEVERITY_NOTICE,
            E_USER_DEPRECATED => self::SEVERITY_NOTICE
        ];
        
        return $map[$errno] ?? self::SEVERITY_ERROR;
    }
    
    /**
     * Get error type name from error number
     */
    private static function getErrorTypeName($errno) {
        $types = [
            E_ERROR => 'E_ERROR',
            E_WARNING => 'E_WARNING',
            E_PARSE => 'E_PARSE',
            E_NOTICE => 'E_NOTICE',
            E_CORE_ERROR => 'E_CORE_ERROR',
            E_CORE_WARNING => 'E_CORE_WARNING',
            E_COMPILE_ERROR => 'E_COMPILE_ERROR',
            E_COMPILE_WARNING => 'E_COMPILE_WARNING',
            E_USER_ERROR => 'E_USER_ERROR',
            E_USER_WARNING => 'E_USER_WARNING',
            E_USER_NOTICE => 'E_USER_NOTICE',
            E_STRICT => 'E_STRICT',
            E_RECOVERABLE_ERROR => 'E_RECOVERABLE_ERROR',
            E_DEPRECATED => 'E_DEPRECATED',
            E_USER_DEPRECATED => 'E_USER_DEPRECATED'
        ];
        
        return $types[$errno] ?? 'UNKNOWN';
    }
    
    /**
     * Get appropriate HTTP status code from exception
     */
    private static function getHttpStatusFromException($exception) {
        // Check for custom exception methods
        if (method_exists($exception, 'getStatusCode')) {
            return $exception->getStatusCode();
        }
        
        // Map known exception types
        $className = get_class($exception);
        
        $statusMap = [
            'InvalidArgumentException' => 400,
            'BadMethodCallException' => 400,
            'UnexpectedValueException' => 400,
            'AuthenticationException' => 401,
            'UnauthorizedException' => 401,
            'ForbiddenException' => 403,
            'NotFoundException' => 404,
            'PDOException' => 500,
            'RuntimeException' => 500
        ];
        
        return $statusMap[$className] ?? 500;
    }
    
    /**
     * Get public-safe error message
     */
    private static function getPublicMessage($exception) {
        // In debug mode, show actual message
        if (self::isDebugMode()) {
            return $exception->getMessage();
        }
        
        // Map exception types to user-friendly messages
        $className = get_class($exception);
        
        $messageMap = [
            'PDOException' => 'A database error occurred. Please try again later.',
            'InvalidArgumentException' => 'Invalid request data provided.',
            'AuthenticationException' => 'Authentication failed.',
            'UnauthorizedException' => 'Authentication required.',
            'ForbiddenException' => 'Access denied.',
            'NotFoundException' => 'Resource not found.'
        ];
        
        return $messageMap[$className] ?? 'An error occurred. Please try again later.';
    }
    
    /**
     * Check if debug mode is enabled
     */
    private static function isDebugMode() {
        return defined('DEBUG_MODE') && DEBUG_MODE === true;
    }
    
    /**
     * Get sanitized request data for logging
     */
    private static function getRequestData() {
        $data = [];
        
        // GET parameters
        if (!empty($_GET)) {
            $data['GET'] = $_GET;
        }
        
        // POST parameters (excluding sensitive fields)
        if (!empty($_POST)) {
            $data['POST'] = self::sanitizeData($_POST);
        }
        
        // JSON body
        $rawBody = file_get_contents('php://input');
        if ($rawBody) {
            $jsonData = json_decode($rawBody, true);
            if ($jsonData) {
                $data['JSON'] = self::sanitizeData($jsonData);
            }
        }
        
        return $data;
    }
    
    /**
     * Remove sensitive data from arrays
     */
    private static function sanitizeData($data) {
        $sensitiveFields = ['password', 'token', 'secret', 'api_key', 'credit_card', 'cvv'];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = self::sanitizeData($value);
            } elseif (in_array(strtolower($key), $sensitiveFields)) {
                $data[$key] = '[REDACTED]';
            }
        }
        
        return $data;
    }
    
    /**
     * Get client IP address
     */
    private static function getClientIp() {
        $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 
                   'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = $_SERVER[$key];
                // Handle comma-separated IPs (for proxies)
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                return trim($ip);
            }
        }
        
        return 'Unknown';
    }
    
    /**
     * Create custom error
     */
    public static function createError($message, $code = 500, $severity = self::SEVERITY_ERROR) {
        self::logError([
            'error_type' => 'CustomError',
            'error_code' => $code,
            'message' => $message,
            'file' => debug_backtrace()[0]['file'] ?? null,
            'line' => debug_backtrace()[0]['line'] ?? null,
            'severity' => $severity
        ]);
        
        self::sendErrorResponse($message, $code);
    }
    
    /**
     * Log custom message without sending response
     */
    public static function log($message, $severity = self::SEVERITY_INFO, $context = []) {
        self::logError(array_merge([
            'error_type' => 'Log',
            'message' => $message,
            'severity' => $severity
        ], $context));
    }
}

// ==========================================
// CUSTOM EXCEPTION CLASSES
// ==========================================

/**
 * Authentication Exception
 */
class AuthenticationException extends Exception {
    public function getStatusCode() {
        return 401;
    }
}

/**
 * Unauthorized Exception
 */
class UnauthorizedException extends Exception {
    public function getStatusCode() {
        return 401;
    }
}

/**
 * Forbidden Exception
 */
class ForbiddenException extends Exception {
    public function getStatusCode() {
        return 403;
    }
}

/**
 * Not Found Exception
 */
class NotFoundException extends Exception {
    public function getStatusCode() {
        return 404;
    }
}

/**
 * Validation Exception
 */
class ValidationException extends Exception {
    private $errors = [];
    
    public function __construct($message = "Validation failed", $errors = []) {
        parent::__construct($message);
        $this->errors = $errors;
    }
    
    public function getStatusCode() {
        return 422;
    }
    
    public function getErrors() {
        return $this->errors;
    }
}

/**
 * Rate Limit Exception
 */
class RateLimitException extends Exception {
    public function getStatusCode() {
        return 429;
    }
}
