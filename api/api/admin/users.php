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
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWT.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);
// $jwt = new JWT();

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
            $total = $user->getCount();
            $active = $user->getCount(['is_active' => 1]);
            $suspended = $user->getCount(['is_active' => 0]); // Assuming 0 is suspended/inactive
            
            Response::success([
                'total' => $total,
                'active' => $active,
                'suspended' => $suspended
            ]);
        } else {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
            $filters = [];
            
            if (isset($_GET['status'])) {
                if ($_GET['status'] === 'active') $filters['is_active'] = 1;
                if ($_GET['status'] === 'suspended') $filters['is_active'] = 0;
            }
            if (isset($_GET['search'])) $filters['search'] = $_GET['search'];
            
            $result = $user->getAll($page, $perPage, $filters);
            
            // Map status for frontend
            foreach ($result['users'] as &$u) {
                $u['status'] = $u['is_active'] == 1 ? 'active' : 'suspended';
                // Add initials if not present
                if (empty($u['initials'])) {
                    $parts = explode(' ', $u['full_name'] ?? $u['username']);
                    $initials = '';
                    foreach ($parts as $part) {
                        $initials .= strtoupper(substr($part, 0, 1));
                    }
                    $u['initials'] = substr($initials, 0, 2);
                }
            }
            
            Response::success($result);
        }
    } elseif ($method === 'POST') {
        if ($endpoint === 'suspend') {
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['user_id'])) {
                Response::error('User ID required', 400);
            }
            
            $userId = $data['user_id'];
            $userDetails = $user->getById($userId);
            
            if (!$userDetails) {
                Response::error('User not found', 404);
            }
            
            // Toggle status. If active (1), make it 0. If inactive (0), make it 1.
            // Note: The User model 'delete' method sets is_active to 0.
            // To 'activate', we might need a raw query if User model doesn't have 'activate' or 'update' with is_active.
            // User model has update method.
            
            $newStatus = $userDetails['is_active'] == 1 ? 0 : 1;
            $success = $user->update($userId, ['is_active' => $newStatus]);
            
            if ($success) {
                Response::success(['message' => 'User status updated', 'new_status' => $newStatus == 1 ? 'active' : 'suspended']);
            } else {
                Response::error('Failed to update user status', 500);
            }
        } else {
            Response::error('Endpoint not found', 404);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
