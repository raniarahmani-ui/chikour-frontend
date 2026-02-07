<?php
/**
 * Application Configuration - EXAMPLE FILE
 * =========================================
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file and rename it to: config.php
 * 2. Update the settings below as needed
 * 3. Generate a new JWT_SECRET for production
 * 
 * Swapie Admin Backend
 */

// =====================================================
// ENVIRONMENT
// =====================================================
define('APP_ENV', 'development');  // 'development' or 'production'
define('APP_DEBUG', true);         // Set to false in production
define('APP_URL', 'http://localhost/swapie');

// =====================================================
// JWT CONFIGURATION
// =====================================================
// IMPORTANT: Generate a new secret for your installation!
// You can use: bin2hex(random_bytes(32))
define('JWT_SECRET', 'your-secret-key-change-this-in-production-make-it-long-and-random');
define('JWT_EXPIRY', 86400);       // Token expiry in seconds (86400 = 24 hours)
define('JWT_ALGORITHM', 'HS256');

// =====================================================
// API SETTINGS
// =====================================================
define('API_VERSION', '1.0.0');
define('ITEMS_PER_PAGE', 20);
define('MAX_ITEMS_PER_PAGE', 100);

// =====================================================
// FILE UPLOAD SETTINGS
// =====================================================
define('UPLOAD_MAX_SIZE', 5 * 1024 * 1024);  // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('UPLOAD_PATH', __DIR__ . '/../uploads/');

// =====================================================
// RATE LIMITING
// =====================================================
define('RATE_LIMIT_REQUESTS', 100);   // Max requests
define('RATE_LIMIT_WINDOW', 60);      // Per X seconds

// =====================================================
// CORS SETTINGS (for frontend)
// =====================================================
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]);

// =====================================================
// ERROR HANDLING
// =====================================================
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('UTC');
