<?php
// backend/api/amanda/profile.php

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

// Fetch User Profile
$query = "SELECT id, username, email, full_name, phone, profile_image as avatar, bio, is_active as status, coins, rating as rating_avg, total_ratings as rating_count, created_at FROM users WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $user_id);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

// Fetch User's Active Services (optional, but good for profile)
$queryServices = "SELECT id, title, price, rating_avg FROM services WHERE user_id = :id AND status = 'active'";
$stmtServices = $db->prepare($queryServices);
$stmtServices->bindParam(':id', $user_id);
$stmtServices->execute();
$services = $stmtServices->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'success' => true, 
    'user' => $user,
    'services' => $services
]);
