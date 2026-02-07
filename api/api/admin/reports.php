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
require_once __DIR__ . '/../../models/Report.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWT.php';

$database = new Database();
$db = $database->getConnection();
$report = new Report($db);
$jwt = new JWT();

// Authorization
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// TODO: In production, verify token and check for admin role
// $userData = $jwt->verify($token);
// if (!$userData || !isset($userData['admin_id'])) {
//     // Response::error('Unauthorized', 401);
// }

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    if ($method === 'GET') {
        if ($endpoint === 'stats') {
            $stats = $report->getStatistics();
            Response::success($stats);
        } else {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
            $filters = [];
            
            if (isset($_GET['status'])) $filters['status'] = $_GET['status'];
            if (isset($_GET['search'])) $filters['search'] = $_GET['search'];
            
            $result = $report->getAll($page, $perPage, $filters);
            Response::success($result);
        }
    } elseif ($method === 'PUT') {
        // Resolve / Update report status
        $data = json_decode(file_get_contents('php://input'), true);
        $reportId = isset($_GET['id']) ? (int)$_GET['id'] : ($data['report_id'] ?? null);
        
        if (!$reportId) {
            Response::error('Report ID is required', 400);
        }
        
        $existingReport = $report->getById($reportId);
        if (!$existingReport) {
            Response::error('Report not found', 404);
        }
        
        $newStatus = $data['status'] ?? 'resolved';
        $adminNote = $data['admin_note'] ?? $data['note'] ?? null;
        
        // Get admin ID from token if available
        $adminId = null;
        if ($token) {
            $payload = JWT::decode($token);
            $adminId = $payload['admin_id'] ?? $payload['id'] ?? null;
        }
        
        $success = $report->updateStatus($reportId, $newStatus, $adminId, $adminNote);
        
        if ($success) {
            $updatedReport = $report->getById($reportId);
            Response::success($updatedReport, 'Report status updated successfully');
        } else {
            Response::error('Failed to update report status', 500);
        }
        
    } elseif ($method === 'DELETE') {
        $reportId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        
        if (!$reportId) {
            Response::error('Report ID is required', 400);
        }
        
        $existingReport = $report->getById($reportId);
        if (!$existingReport) {
            Response::error('Report not found', 404);
        }
        
        $success = $report->delete($reportId);
        
        if ($success) {
            Response::success(null, 'Report deleted successfully');
        } else {
            Response::error('Failed to delete report', 500);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
