<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';

try {
    $db = (new Database())->getConnection();
    
    // Get token to determine user type
    $token = JWT::getTokenFromHeader();
    $isAdmin = false;
    
    if ($token) {
        $payload = JWT::decode($token);
        $isAdmin = isset($payload['type']) && $payload['type'] === 'admin';
    }
    
    $stats = [];
    
    if ($isAdmin) {
        // Admin stats: report count
        $reportStmt = $db->query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
        $stats['reports'] = (int) $reportStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Total users
        $userStmt = $db->query("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
        $stats['total_users'] = (int) $userStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Total services
        $serviceStmt = $db->query("SELECT COUNT(*) as count FROM services");
        $stats['total_services'] = (int) $serviceStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
    } else {
        // User stats: notification count
        if ($token && isset($payload['user_id'])) {
            $notifStmt = $db->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND is_read = 0");
            $notifStmt->execute(['user_id' => $payload['user_id']]);
            $stats['notifications'] = (int) $notifStmt->fetch(PDO::FETCH_ASSOC)['count'];
        } else {
            $stats['notifications'] = 0;
        }
    }
    
    Response::success($stats, 'Stats retrieved successfully');
    
} catch (Exception $e) {
    Response::error('Failed to fetch stats: ' . $e->getMessage(), 500);
}
