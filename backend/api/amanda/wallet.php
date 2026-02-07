<?php
// backend/api/amanda/wallet.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWT.php';

// Verify Token
$token = JWT::getTokenFromHeader();
$payload = JWT::decode($token);

if (!$payload) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = $payload['user_id'];

$database = new Database();
$db = $database->getConnection();

// Fetch Wallet Balance
$queryUser = "SELECT coins FROM users WHERE id = :id";
$stmtUser = $db->prepare($queryUser);
$stmtUser->execute(['id' => $user_id]);
$balance = $stmtUser->fetchColumn() ?: 0;
// total_earned doesn't exist in users table
$totalEarned = 0;

// Fetch Pending Balance & Expected Date
$queryPending = "SELECT SUM(coins) as total, MIN(created_at) as earliest FROM transactions WHERE to_user_id = :id AND status = 'pending'";
$stmtPending = $db->prepare($queryPending);
$stmtPending->execute(['id' => $user_id]);
$pendingData = $stmtPending->fetch(PDO::FETCH_ASSOC);
$pendingBalance = $pendingData['total'] ?: 0;
$expectedDate = null;
if ($pendingData['earliest']) {
    $date = new DateTime($pendingData['earliest']);
    $date->modify('+3 days');
    $expectedDate = $date->format('M j, Y');
}

// Fetch Transactions (all for this user)
$queryTrans = "SELECT t.*, 
               u_from.username as from_username, 
               u_to.username as to_username
               FROM transactions t
               LEFT JOIN users u_from ON t.from_user_id = u_from.id
               LEFT JOIN users u_to ON t.to_user_id = u_to.id
               WHERE t.from_user_id = :id1 OR t.to_user_id = :id2 
               ORDER BY t.created_at DESC LIMIT 100";
$stmtTrans = $db->prepare($queryTrans);
$stmtTrans->execute(['id1' => $user_id, 'id2' => $user_id]);
$transactions = $stmtTrans->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true, 
    'balance' => (int)$balance, 
    'coin_balance' => (int)$balance, // Standardize with dashboard if needed
    'pending_balance' => (int)$pendingBalance,
    'expected_date' => $expectedDate,
    'total_earned' => (int)$totalEarned,
    'transactions' => $transactions
]);
