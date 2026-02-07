<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . '/config/config.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, ALLOWED_ORIGINS)) {
    header("Access-Control-Allow-Origin: {$origin}");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/utils/Response.php';

$endpoint = $_GET['endpoint'] ?? '';

if (!empty($endpoint)) {
    $_SERVER['REQUEST_URI'] = '/backend/api/' . $endpoint;
    if (isset($_GET['id'])) {
        $_SERVER['REQUEST_URI'] .= '/' . $_GET['id'];
    }
    if (isset($_GET['action'])) {
        $_SERVER['REQUEST_URI'] .= '/' . $_GET['action'];
    }
}

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
    case 'profile':
        require_once __DIR__ . '/api/profile.php';
        break;
    case '':
        Response::success([
            'name' => API_NAME,
            'version' => API_VERSION,
            'status' => 'running',
            'usage' => 'api.php?endpoint=<endpoint>&id=<id>&action=<action>',
            'endpoints' => ['auth', 'users', 'services', 'demands', 'categories', 'transactions', 'dashboard', 'admins', 'profile']
        ], 'Swapie Admin API is running');
        break;
    default:
        Response::notFound("Endpoint not found");
}
