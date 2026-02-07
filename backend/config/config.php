<?php
/*
  Global Configuration
  Admin Backend
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Timezone
date_default_timezone_set('UTC');

// API Configuration
define('API_VERSION', '1.0.0');
define('API_NAME', 'Swapie Admin API');

// JWT Configuration
define('JWT_SECRET', 'your-super-secret-key-change-in-production-2024');
define('JWT_EXPIRY', 3600 * 24);

// Pagination defaults
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// File upload settings
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// User status constants
define('STATUS_ACTIVE', 'active');
define('STATUS_SUSPENDED', 'suspended');
define('STATUS_PENDING', 'pending');
define('STATUS_DELETED', 'deleted');

// Transaction status constants
define('TRANSACTION_PENDING', 'pending');
define('TRANSACTION_COMPLETED', 'completed');
define('TRANSACTION_CANCELLED', 'cancelled');
define('TRANSACTION_REFUNDED', 'refunded');

// Service/Demand status constants
define('ITEM_ACTIVE', 'active');
define('ITEM_INACTIVE', 'inactive');
define('ITEM_SUSPENDED', 'suspended');
define('ITEM_PENDING', 'pending');

// CORS Configuration
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'https://swapie.vercel.app' // Replace with your actual vercel domain
]);

// Email configuration
define('EMAIL_FROM', 'no-reply@swapie.local');
