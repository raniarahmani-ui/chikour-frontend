<?php
// Admin dashboard statistics and overview

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Service.php';
require_once __DIR__ . '/../models/Demand.php';
require_once __DIR__ . '/../models/Transaction.php';
require_once __DIR__ . '/../models/Category.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

// Authenticate
$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

$method = $_SERVER['REQUEST_METHOD'];

// Parse URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

if ($method !== 'GET') {
    Response::methodNotAllowed();
}

// Determine which dashboard endpoint is being requested
if (strpos($path, '/dashboard/overview') !== false) {
    getOverview($db);
} elseif (strpos($path, '/dashboard/stats') !== false) {
    getStats($db);
} elseif (strpos($path, '/dashboard/recent-activity') !== false) {
    getRecentActivity($db);
} elseif (strpos($path, '/dashboard/charts') !== false) {
    getChartData($db);
} else {
    // Default: return full dashboard data
    getFullDashboard($db);
}

function getFullDashboard($db) {
    $user = new User($db);
    $service = new Service($db);
    $demand = new Demand($db);
    $transaction = new Transaction($db);
    $category = new Category($db);
    
    $data = [
        'overview' => [
            'total_users' => $user->getCount(),
            'active_users' => $user->getCount(['status' => 'active']),
            'total_services' => $service->getCount(),
            'active_services' => $service->getCount(['status' => 'active']),
            'pending_services' => $service->getCount(['status' => 'pending']),
            'total_demands' => $demand->getCount(),
            'open_demands' => $demand->getCount(['status' => 'open']),
            'total_transactions' => $transaction->getCount(),
            'total_revenue' => $transaction->getTotalAmount(['status' => 'completed']),
            'total_categories' => $category->getCount(['status' => 'active'])
        ],
        'recent_users' => getRecentUsers($user, 5),
        'recent_services' => $service->getRecent(5),
        'recent_demands' => $demand->getRecent(5),
        'recent_transactions' => $transaction->getRecent(5),
        'transaction_stats' => $transaction->getStatistics()
    ];
    
    Response::success($data);
}

function getOverview($db) {
    $user = new User($db);
    $service = new Service($db);
    $demand = new Demand($db);
    $transaction = new Transaction($db);
    $category = new Category($db);
    
    $data = [
        'users' => [
            'total' => $user->getCount(),
            'active' => $user->getCount(['status' => 'active']),
            'inactive' => $user->getCount(['status' => 'inactive']),
            'suspended' => $user->getCount(['status' => 'suspended'])
        ],
        'services' => [
            'total' => $service->getCount(),
            'active' => $service->getCount(['status' => 'active']),
            'pending' => $service->getCount(['status' => 'pending']),
            'inactive' => $service->getCount(['status' => 'inactive'])
        ],
        'demands' => [
            'total' => $demand->getCount(),
            'open' => $demand->getCount(['status' => 'open']),
            'in_progress' => $demand->getCount(['status' => 'in_progress']),
            'completed' => $demand->getCount(['status' => 'completed'])
        ],
        'transactions' => [
            'total' => $transaction->getCount(),
            'completed' => $transaction->getCount(['status' => 'completed']),
            'pending' => $transaction->getCount(['status' => 'pending']),
            'total_amount' => $transaction->getTotalAmount(['status' => 'completed'])
        ],
        'categories' => [
            'total' => $category->getCount(),
            'active' => $category->getCount(['status' => 'active'])
        ]
    ];
    
    Response::success($data);
}

function getStats($db) {
    $transaction = new Transaction($db);
    
    $dateFrom = $_GET['date_from'] ?? date('Y-m-d', strtotime('-30 days'));
    $dateTo = $_GET['date_to'] ?? date('Y-m-d');
    
    $filters = [
        'date_from' => $dateFrom,
        'date_to' => $dateTo
    ];
    
    $stats = $transaction->getStatistics($filters);
    $dailySummary = $transaction->getDailySummary(30);
    
    Response::success([
        'summary' => $stats,
        'daily' => $dailySummary
    ]);
}

function getRecentActivity($db) {
    $user = new User($db);
    $service = new Service($db);
    $demand = new Demand($db);
    $transaction = new Transaction($db);
    
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 20) : 10;
    
    $data = [
        'recent_users' => getRecentUsers($user, $limit),
        'recent_services' => $service->getRecent($limit),
        'recent_demands' => $demand->getRecent($limit),
        'recent_transactions' => $transaction->getRecent($limit)
    ];
    
    Response::success($data);
}

function getChartData($db) {
    $transaction = new Transaction($db);
    
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
    
    $data = [
        'transactions' => $transaction->getDailySummary($days)
    ];
    
    // Add more chart data as needed
    Response::success($data);
}

/**
 * Get recent users helper
 */
function getRecentUsers($user, $limit) {
    $result = $user->getAll(1, $limit, []);
    return $result['users'];
}
