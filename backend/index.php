<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config/config.php';

// Handle CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow any origin provided it is set (enables credential usage)
if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
}

// Standard headers
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/utils/Response.php';

$requestUri = $_SERVER['REQUEST_URI'];

$path = parse_url($requestUri, PHP_URL_PATH);

// Handle various base paths (XAMPP htdocs folder, development paths)
$basePaths = ['/swapie/api', '/swapie', '/backend/backend/api', '/backend/backend', '/backend/api', '/backend', '/api', ''];
foreach ($basePaths as $basePath) {
    if ($basePath && strpos($path, $basePath) === 0) {
        $path = substr($path, strlen($basePath));
        break;
    }
}

$path = trim($path, '/');
$segments = explode('/', $path);

// Handle 'api' as first segment - remove it to get actual endpoint
if (isset($segments[0]) && $segments[0] === 'api') {
    array_shift($segments);
}

// Get the endpoint (could be empty if path was just '/api' or '/')
$endpoint = $segments[0] ?? '';

switch ($endpoint) {
    case 'auth':
        require_once __DIR__ . '/api/auth.php';
        break;
    case 'users':
        require_once __DIR__ . '/api/users.php';
        break;
    case 'services':
        require_once __DIR__ . '/api/services.php';
        break;
    case 'demands':
        require_once __DIR__ . '/api/demands.php';
        break;
    case 'categories':
        require_once __DIR__ . '/api/categories.php';
        break;
    case 'transactions':
        require_once __DIR__ . '/api/transactions.php';
        break;
    case 'dashboard':
        require_once __DIR__ . '/api/dashboard.php';
        break;
    case 'admins':
        require_once __DIR__ . '/api/admins.php';
        break;
    case 'messages':
        require_once __DIR__ . '/api/messages.php';
        break;
    case 'profile':
        require_once __DIR__ . '/api/profile.php';
        break;
    case '':
        Response::success([
            'name' => API_NAME,
            'version' => API_VERSION,
            'status' => 'running',
            'endpoints' => [
                'auth' => '/api/auth',
                'users' => '/api/users',
                'services' => '/api/services',
                'demands' => '/api/demands',
                'categories' => '/api/categories',
                'transactions' => '/api/transactions',
                'dashboard' => '/api/dashboard',
                'admins' => '/api/admins',
                'messages' => '/api/messages',
                'profile' => '/api/profile'
            ]
        ], 'Swapie Admin API is running');
        break;
    default:
        Response::notFound("Endpoint not found");
}
