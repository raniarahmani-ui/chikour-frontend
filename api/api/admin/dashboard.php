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
require_once __DIR__ . '/../../models/User.php';
require_once __DIR__ . '/../../models/Transaction.php';
require_once __DIR__ . '/../../models/Service.php';
require_once __DIR__ . '/../../models/Report.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWT.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
$transaction = new Transaction($db);
$service = new Service($db);
$report = new Report($db);

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    if ($method === 'GET') {
        if ($endpoint === 'stats') {
            // 1. Total Coins in Circulation (sum of all active users' coin balances)
            $stmt = $db->query("SELECT SUM(coins) as total FROM users WHERE is_active = 1");
            $totalCoins = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            
            // 2. Coin Purchase Revenue (total coins purchased)
            $queryRevenue = "SELECT SUM(coins) as total FROM transactions WHERE type = 'purchase' AND status = 'completed'";
            $stmtRevenue = $db->prepare($queryRevenue);
            $stmtRevenue->execute();
            $revenue = $stmtRevenue->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            
            // 3. Live Service Trades
            $liveServices = $service->getCount(['status' => 'active']);
            
            // 4. Pending Disputes
            $pendingDisputes = 0;
            try {
                $statsData = $report->getStatistics();
                $pendingDisputes = $statsData['pending_count'] ?? 0;
            } catch (Exception $e) {
                // Ignore if reports table has issues
            }
            
            // 5. User Balance Stats (NEW)
            $stmtUserStats = $db->query("SELECT 
                COUNT(*) as total_users,
                SUM(coins) as total_balances, 
                AVG(coins) as avg_balance
                FROM users WHERE is_active = 1");
            $userStats = $stmtUserStats->fetch(PDO::FETCH_ASSOC);
            
            // 6. Total Purchased (what users bought)
            $stmtPurchased = $db->query("SELECT SUM(coins) as total FROM transactions WHERE type = 'purchase' AND status = 'completed'");
            $totalPurchased = $stmtPurchased->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            
            // 7. Total Bonus Points Given
            $stmtBonus = $db->query("SELECT SUM(coins) as total FROM transactions WHERE type = 'bonus' AND status = 'completed'");
            $totalBonus = $stmtBonus->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            
            Response::success([
                'total_coins' => (int)$totalCoins,
                'revenue' => (float)$revenue,
                'live_services' => (int)$liveServices,
                'pending_disputes' => (int)$pendingDisputes,
                'user_stats' => [
                    'total_users' => (int)($userStats['total_users'] ?? 0),
                    'total_balances' => (int)($userStats['total_balances'] ?? 0),
                    'avg_balance' => round((float)($userStats['avg_balance'] ?? 0), 2),
                    'total_purchased' => (int)$totalPurchased,
                    'total_bonus_points' => (int)$totalBonus
                ]
            ]);
            
        } elseif ($endpoint === 'charts') {
            // Chart data for dashboard graphs
            
            // 1. User registrations by day (last 30 days)
            $stmtReg = $db->query("SELECT DATE(created_at) as day, COUNT(*) as count 
                                   FROM users 
                                   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                                   GROUP BY DATE(created_at) 
                                   ORDER BY day ASC");
            $registrations = $stmtReg->fetchAll(PDO::FETCH_ASSOC);
            
            // 2. Service exchanges by day (last 30 days)
            $stmtExch = $db->query("SELECT DATE(created_at) as day, COUNT(*) as count 
                                    FROM transactions 
                                    WHERE type IN ('service_payment','demand_payment') 
                                    AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                                    GROUP BY DATE(created_at) 
                                    ORDER BY day ASC");
            $exchanges = $stmtExch->fetchAll(PDO::FETCH_ASSOC);
            
            // 3. Categories by service count (top 8)
            $stmtCats = $db->query("SELECT c.name, COUNT(s.id) as service_count 
                                    FROM categories c 
                                    LEFT JOIN services s ON s.category_id = c.id 
                                    GROUP BY c.id, c.name 
                                    ORDER BY service_count DESC 
                                    LIMIT 8");
            $categoryStats = $stmtCats->fetchAll(PDO::FETCH_ASSOC);
            
            // 4. Purchases by day (last 30 days)
            $stmtPurch = $db->query("SELECT DATE(created_at) as day, COUNT(*) as count, SUM(coins) as total_coins
                                     FROM transactions 
                                     WHERE type = 'purchase' 
                                     AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                                     GROUP BY DATE(created_at) 
                                     ORDER BY day ASC");
            $purchases = $stmtPurch->fetchAll(PDO::FETCH_ASSOC);
            
            Response::success([
                'registrations' => $registrations,
                'exchanges' => $exchanges,
                'category_stats' => $categoryStats,
                'purchases' => $purchases
            ]);
            
        } elseif ($endpoint === 'activity') {
            // 1. Recent Coin Purchases - use to_user_id for Railway DB
            $queryPurchases = "SELECT t.id, t.coins, t.created_at, u.full_name as user_name 
                               FROM transactions t 
                               LEFT JOIN users u ON t.to_user_id = u.id 
                               WHERE t.type = 'purchase' 
                               ORDER BY t.created_at DESC LIMIT 5";
            $stmtPurchases = $db->prepare($queryPurchases);
            $stmtPurchases->execute();
            $purchases = $stmtPurchases->fetchAll(PDO::FETCH_ASSOC);
            
            // 2. Pending Interventions (Reports)
            $pendingReports = ['reports' => []];
            try {
                $pendingReports = $report->getAll(1, 5, ['status' => 'pending']);
            } catch (Exception $e) {
                // Ignore if reports table has issues
            }
            
            // 3. Platform Status Counts - use raw queries to avoid Transaction model issues
            $today = date('Y-m-d');
            
            $stmtPurchasesToday = $db->prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'purchase' AND created_at >= :today");
            $stmtPurchasesToday->execute(['today' => $today]);
            $purchasesToday = $stmtPurchasesToday->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
            
            $stmtExchanges = $db->query("SELECT COUNT(*) as count FROM transactions WHERE status = 'completed'");
            $completedExchanges = $stmtExchanges->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;
            
            Response::success([
                'recent_purchases' => $purchases,
                'pending_interventions' => $pendingReports['reports'],
                'platform_status' => [
                    'purchases_today' => (int)$purchasesToday,
                    'completed_exchanges' => (int)$completedExchanges
                ]
            ]);
            
        } else {
             Response::error('Invalid endpoint', 400);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
