<?php
// backend/api/amanda/buy_coins.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/JWT.php';

try {
    // Verify Token
    $token = JWT::getTokenFromHeader();
    $payload = JWT::decode($token);

    if (!$payload) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    $user_id = $payload['user_id'] ?? $payload['id'] ?? null;
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token: no user ID']);
        exit;
    }

    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['amount']) || !is_numeric($data['amount']) || $data['amount'] <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid amount']);
        exit;
    }

    $amount = (int)$data['amount'];

    $database = new Database();
    $db = $database->getConnection();

    $db->beginTransaction();

    // Add coins to user
    $queryUpdate = "UPDATE users SET coins = coins + :amount WHERE id = :id";
    $stmtUpdate = $db->prepare($queryUpdate);
    $stmtUpdate->bindParam(':amount', $amount, PDO::PARAM_INT);
    $stmtUpdate->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmtUpdate->execute();

    // Record Transaction - use the buying user as to_user_id, from_user_id = user's own ID to avoid FK issues
    $queryTrans = "INSERT INTO transactions (from_user_id, to_user_id, type, coins, status, notes, created_at) 
                   VALUES (:from_id, :to_id, 'purchase', :coins, 'completed', :notes, NOW())";
    $stmtTrans = $db->prepare($queryTrans);
    $stmtTrans->bindParam(':from_id', $user_id, PDO::PARAM_INT);
    $stmtTrans->bindParam(':to_id', $user_id, PDO::PARAM_INT);
    $stmtTrans->bindParam(':coins', $amount, PDO::PARAM_INT);
    $note = "Purchased {$amount} coins";
    $stmtTrans->bindParam(':notes', $note);
    $stmtTrans->execute();

    $db->commit();

    // Fetch current balance to return accurate info
    $stmtBalance = $db->prepare("SELECT coins FROM users WHERE id = :id");
    $stmtBalance->execute(['id' => $user_id]);
    $userRow = $stmtBalance->fetch(PDO::FETCH_ASSOC);
    $newBalance = $userRow['coins'] ?? 0;

    echo json_encode([
        'success' => true, 
        'message' => 'Coins purchased successfully', 
        'new_balance' => (int)$newBalance
    ]);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Transaction failed: ' . $e->getMessage()]);
}
