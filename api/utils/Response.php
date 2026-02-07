<?php
/**
 * API Response Helper
 * Standardizes all API responses
 */

class Response {
    
    /**
     * Send success response
     * @param mixed $data Response data
     * @param string $message Success message
     * @param int $statusCode HTTP status code
     */
    public static function success($data = null, $message = "Success", $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    /**
     * Send error response
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     * @param array $errors Additional error details
     */
    public static function error($message = "An error occurred", $statusCode = 400, $errors = []) {
        http_response_code($statusCode);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    /**
     * Send paginated response
     * @param array $data Data array
     * @param int $page Current page
     * @param int $perPage Items per page
     * @param int $total Total items
     */
    public static function paginated($data, $page, $perPage, $total) {
        $totalPages = ceil($total / $perPage);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$perPage,
                'total_items' => (int)$total,
                'total_pages' => (int)$totalPages,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1
            ],
            'timestamp' => date('c')
        ]);
        exit;
    }
    
    /**
     * Send validation error response
     * @param array $errors Validation errors
     */
    public static function validationError($errors) {
        self::error("Validation failed", 422, $errors);
    }
    
    /**
     * Send unauthorized response
     */
    public static function unauthorized($message = "Unauthorized access") {
        self::error($message, 401);
    }
    
    /**
     * Send forbidden response
     */
    public static function forbidden($message = "Access forbidden") {
        self::error($message, 403);
    }
    
    /**
     * Send not found response
     */
    public static function notFound($message = "Resource not found") {
        self::error($message, 404);
    }
    
    /**
     * Send method not allowed response
     */
    public static function methodNotAllowed() {
        self::error("Method not allowed", 405);
    }
    
    /**
     * Send conflict response (e.g., duplicate entry)
     * @param string $message
     */
    public static function conflict($message = "Resource already exists") {
        self::error($message, 409);
    }
    
    /**
     * Send too many requests response (rate limiting)
     * @param string $message
     * @param int $retryAfter Seconds until retry is allowed
     */
    public static function tooManyRequests($message = "Too many requests", $retryAfter = 60) {
        header("Retry-After: {$retryAfter}");
        self::error($message, 429);
    }
    
    /**
     * Send internal server error response
     * @param string $message
     */
    public static function serverError($message = "Internal server error") {
        self::error($message, 500);
    }
    
    /**
     * Send service unavailable response
     * @param string $message
     */
    public static function serviceUnavailable($message = "Service temporarily unavailable") {
        self::error($message, 503);
    }
    
    /**
     * Send a raw JSON response
     * @param mixed $data
     * @param int $statusCode
     */
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
}
