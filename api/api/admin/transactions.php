<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Transaction.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWT.php';

$database = new Database();
$db = $database->getConnection();
$transaction = new Transaction($db);
$jwt = new JWT();

// Authorization
// $headers = getallheaders();
// $authHeader = $headers['Authorization'] ?? '';
// $token = str_replace('Bearer ', '', $authHeader);

// TODO: In production, verify token and check for admin role

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    if ($method === 'GET') {
        if ($endpoint === 'stats') {
            $stats = $transaction->getStatistics();
            Response::success($stats);
        } elseif ($endpoint === 'recent') {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $recent = $transaction->getRecent($limit);
            Response::success(['recent_transactions' => $recent]);
        } elseif ($endpoint === 'daily_summary') {
            $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
            $summary = $transaction->getDailySummary($days);
            Response::success(['daily_summary' => $summary]);
        } else {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 50;
            $filters = [];
            
            if (isset($_GET['type'])) $filters['type'] = $_GET['type'];
            if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
            if (isset($_GET['search'])) $filters['search'] = $_GET['search'];
            
            $result = $transaction->getAll($page, $perPage, $filters);
            Response::success($result);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
