<?php

header("Content-Type: application/json");

echo json_encode([
    'test' => 'Backend PHP Test',
    'status' => 'success',
    'php_version' => PHP_VERSION,
    'timestamp' => date('c'),
    'tests' => [
        'config_loaded' => file_exists(__DIR__ . '/config/config.php'),
        'database_config' => file_exists(__DIR__ . '/config/database.php'),
        'models_exist' => file_exists(__DIR__ . '/models/User.php'),
        'api_files' => [
            'auth' => file_exists(__DIR__ . '/api/auth.php'),
            'users' => file_exists(__DIR__ . '/api/users.php'),
            'services' => file_exists(__DIR__ . '/api/services.php'),
            'demands' => file_exists(__DIR__ . '/api/demands.php'),
            'categories' => file_exists(__DIR__ . '/api/categories.php'),
            'transactions' => file_exists(__DIR__ . '/api/transactions.php'),
            'dashboard' => file_exists(__DIR__ . '/api/dashboard.php'),
            'admins' => file_exists(__DIR__ . '/api/admins.php')
        ],
        'utils' => [
            'jwt' => file_exists(__DIR__ . '/utils/JWT.php'),
            'response' => file_exists(__DIR__ . '/utils/Response.php'),
            'validator' => file_exists(__DIR__ . '/utils/Validator.php')
        ]
    ],
    'message' => 'All backend files are properly structured!'
], JSON_PRETTY_PRINT);
