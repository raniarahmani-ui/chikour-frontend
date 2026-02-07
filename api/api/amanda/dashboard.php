<?php
// backend/api/amanda/dashboard.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWT.php';

$token = JWT::getTokenFromHeader();
$payload = JWT::decode($token);

if (!$payload) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $payload['user_id'];
$db = (new Database())->getConnection();

// Basic stats
$stmt = $db->prepare("SELECT coins, rating FROM users WHERE id = :id");
$stmt->execute(['id' => $user_id]);
$user = $stmt->fetch();

// Calculate Spend/Earn
$stmtEarn = $db->prepare("SELECT SUM(coins) FROM transactions WHERE to_user_id = :id AND status = 'completed'");
$stmtEarn->execute(['id' => $user_id]);
$earned = $stmtEarn->fetchColumn() ?: 0;

$stmtSpent = $db->prepare("SELECT SUM(coins) FROM transactions WHERE from_user_id = :id AND status = 'completed'");
$stmtSpent->execute(['id' => $user_id]);
$spent = $stmtSpent->fetchColumn() ?: 0;

// Transactions
$stmtTrans = $db->prepare("SELECT * FROM transactions WHERE from_user_id = :id OR to_user_id = :id ORDER BY created_at DESC LIMIT 5");
$stmtTrans->execute(['id' => $user_id]);
$transactions = $stmtTrans->fetchAll();

echo json_encode([
    'success' => true,
    'data' => [
        'balance' => (int)($user['coins'] ?? 0),
        'coin_balance' => (int)($user['coins'] ?? 0),
        'rating_avg' => (float)($user['rating'] ?? 0),
        'total_earned' => (int)$earned,
        'total_spent' => (int)$spent,
        'transactions' => $transactions
    ]
]);
