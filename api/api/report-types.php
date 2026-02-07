<?php
/**
 * Report Types API
 * Admin management of report categories
 * 
 * Endpoints:
 * GET    /api/report-types           - List all report types
 * GET    /api/report-types/{id}      - Get report type details
 * POST   /api/report-types           - Create new report type (admin)
 * PUT    /api/report-types/{id}      - Update report type (admin)
 * DELETE /api/report-types/{id}      - Delete report type (admin)
 * PUT    /api/report-types/{id}/toggle - Toggle active status (admin)
 * PUT    /api/report-types/reorder   - Reorder report types (admin)
 * GET    /api/report-types/stats     - Get report counts by type (admin)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/ErrorHandler.php';
require_once __DIR__ . '/../models/ReportType.php';

// Initialize error handler
ErrorHandler::init();

$database = new Database();
$db = $database->getConnection();
$reportType = new ReportType($db);
$jwt = new JWT();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse the path
$basePath = '/api/report-types';
$path = parse_url($uri, PHP_URL_PATH);
$path = str_replace($basePath, '', $path);
$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

// Check for admin authentication for write operations
$isAdmin = false;
$adminId = null;

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!empty($token)) {
    $payload = $jwt->verify($token);
    if ($payload && isset($payload['admin_id'])) {
        $isAdmin = true;
        $adminId = $payload['admin_id'];
    }
}

try {
    switch ($method) {
        case 'GET':
            if (empty($pathParts)) {
                // GET /api/report-types - List all
                getReportTypes($reportType);
            } elseif ($pathParts[0] === 'stats') {
                // GET /api/report-types/stats - Get statistics
                if (!$isAdmin) {
                    Response::forbidden('Admin access required');
                }
                getReportTypeStats($reportType);
            } elseif (is_numeric($pathParts[0])) {
                // GET /api/report-types/{id}
                getReportType($reportType, (int)$pathParts[0]);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        case 'POST':
            if (!$isAdmin) {
                Response::forbidden('Admin access required');
            }
            // POST /api/report-types - Create new
            createReportType($reportType);
            break;
            
        case 'PUT':
            if (!$isAdmin) {
                Response::forbidden('Admin access required');
            }
            
            if ($pathParts[0] === 'reorder') {
                // PUT /api/report-types/reorder
                reorderReportTypes($reportType);
            } elseif (isset($pathParts[1]) && $pathParts[1] === 'toggle') {
                // PUT /api/report-types/{id}/toggle
                toggleReportType($reportType, (int)$pathParts[0]);
            } elseif (is_numeric($pathParts[0])) {
                // PUT /api/report-types/{id}
                updateReportType($reportType, (int)$pathParts[0]);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        case 'DELETE':
            if (!$isAdmin) {
                Response::forbidden('Admin access required');
            }
            
            if (isset($pathParts[0]) && is_numeric($pathParts[0])) {
                deleteReportType($reportType, (int)$pathParts[0]);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        default:
            Response::methodNotAllowed();
    }
} catch (Exception $e) {
    ErrorHandler::handle($e);
}

// ==========================================
// HANDLER FUNCTIONS
// ==========================================

/**
 * Get all report types
 */
function getReportTypes($reportType) {
    $activeOnly = isset($_GET['active_only']) ? filter_var($_GET['active_only'], FILTER_VALIDATE_BOOLEAN) : true;
    $entityType = $_GET['entity_type'] ?? null;
    
    // Validate entity type if provided
    if ($entityType && !in_array($entityType, ['user', 'service', 'demand', 'all'])) {
        Response::error('Invalid entity type', 400);
    }
    
    $types = $reportType->getAll($activeOnly, $entityType);
    Response::success($types);
}

/**
 * Get single report type
 */
function getReportType($reportType, $id) {
    $type = $reportType->getById($id);
    
    if (!$type) {
        Response::notFound('Report type not found');
    }
    
    Response::success($type);
}

/**
 * Create new report type
 */
function createReportType($reportType) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator($data ?? []);
    $validator
        ->required('name', 'Name is required')
        ->minLength('name', 2, 'Name must be at least 2 characters')
        ->maxLength('name', 100, 'Name cannot exceed 100 characters');
    
    if (isset($data['entity_type'])) {
        $validator->inArray('entity_type', ['user', 'service', 'demand', 'all'], 'Invalid entity type');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if slug already exists
    if (isset($data['slug']) && $reportType->slugExists($data['slug'])) {
        Response::error('Slug already exists', 409);
    }
    
    $typeId = $reportType->create($data);
    
    if (!$typeId) {
        Response::error('Failed to create report type', 500);
    }
    
    $newType = $reportType->getById($typeId);
    Response::success($newType, 'Report type created successfully', 201);
}

/**
 * Update report type
 */
function updateReportType($reportType, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $existingType = $reportType->getById($id);
    if (!$existingType) {
        Response::notFound('Report type not found');
    }
    
    $validator = new Validator($data ?? []);
    
    if (isset($data['name'])) {
        $validator
            ->minLength('name', 2, 'Name must be at least 2 characters')
            ->maxLength('name', 100, 'Name cannot exceed 100 characters');
    }
    
    if (isset($data['entity_type'])) {
        $validator->inArray('entity_type', ['user', 'service', 'demand', 'all'], 'Invalid entity type');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if new slug already exists
    if (isset($data['slug']) && $reportType->slugExists($data['slug'], $id)) {
        Response::error('Slug already exists', 409);
    }
    
    if (!$reportType->update($id, $data)) {
        Response::error('Failed to update report type', 500);
    }
    
    $updatedType = $reportType->getById($id);
    Response::success($updatedType, 'Report type updated successfully');
}

/**
 * Delete report type
 */
function deleteReportType($reportType, $id) {
    $existingType = $reportType->getById($id);
    if (!$existingType) {
        Response::notFound('Report type not found');
    }
    
    if (!$reportType->delete($id)) {
        Response::error('Failed to delete report type', 500);
    }
    
    Response::success(null, 'Report type deleted successfully');
}

/**
 * Toggle active status
 */
function toggleReportType($reportType, $id) {
    $existingType = $reportType->getById($id);
    if (!$existingType) {
        Response::notFound('Report type not found');
    }
    
    if (!$reportType->toggleActive($id)) {
        Response::error('Failed to toggle report type status', 500);
    }
    
    $updatedType = $reportType->getById($id);
    Response::success($updatedType, 'Report type status toggled successfully');
}

/**
 * Reorder report types
 */
function reorderReportTypes($reportType) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['order']) || !is_array($data['order'])) {
        Response::error('Order array is required', 400);
    }
    
    if (!$reportType->reorder($data['order'])) {
        Response::error('Failed to reorder report types', 500);
    }
    
    Response::success(null, 'Report types reordered successfully');
}

/**
 * Get report type statistics
 */
function getReportTypeStats($reportType) {
    $stats = $reportType->getReportCounts();
    Response::success($stats);
}
