<?php
// Admin management + User creation of demands

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../models/Demand.php';
require_once __DIR__ . '/../models/User.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$demand = new Demand($db);

// Parse URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/demands\/(\d+)/', $path, $matches);
$demandId = $matches[1] ?? null;

// Check for action
preg_match('/\/demands\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;

// Public endpoints - user demand creation
if (strpos($path, '/demands/create') !== false && $method === 'POST') {
    createUserDemand($demand, $db);
    exit;
}

// User: Delete own demand
if (strpos($path, '/demands/user-delete') !== false && $method === 'POST') {
    userDeleteDemand($demand, $db);
    exit;
}

// Public endpoints - stats without auth
if (strpos($path, '/demands/stats') !== false && $method === 'GET') {
    getStats($demand);
    exit;
}

if (strpos($path, '/demands/recent') !== false && $method === 'GET') {
    getRecent($demand);
    exit;
}

if (strpos($path, '/demands/expiring') !== false && $method === 'GET') {
    getExpiring($demand);
    exit;
}

// User Action: Propose Yourself
if (strpos($path, '/demands/propose') !== false && $method === 'POST') {
    proposeDemand($demand, $db);
    exit;
}

// For admin endpoints, require authentication
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

switch ($method) {
    case 'GET':
        if ($demandId) {
            getDemand($demandId, $demand);
        } else {
            getDemands($demand);
        }
        break;
    case 'POST':
        createDemand($demand, $auth);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$demandId) {
            Response::error("Demand ID is required");
        }
        if ($action === 'status') {
            updateDemandStatus($demandId, $demand, $auth);
        } else {
            updateDemand($demandId, $demand, $auth);
        }
        break;
    case 'DELETE':
        if (!$demandId) {
            Response::error("Demand ID is required");
        }
        deleteDemand($demandId, $demand, $auth);
        break;
    default:
        Response::methodNotAllowed();
}

/**
 * Create demand from user (not admin)
 */
function createUserDemand($demand, $db) {
    // Verify user token
    $token = JWT::getTokenFromHeader();
    if (!$token) {
        Response::unauthorized("Authentication required");
    }
    
    $payload = JWT::decode($token);
    if (!$payload || !isset($payload['user_id'])) {
        Response::unauthorized("Invalid token");
    }
    
    // Verify user exists and is active
    $user = new User($db);
    $userData = $user->getById($payload['user_id']);
    if (!$userData || $userData['status'] !== 'active') {
        Response::unauthorized("User account is not active");
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Force user_id from token
    $data['user_id'] = $payload['user_id'];
    
    // Validate input
    $validator = new Validator($data);
    $validator
        ->required('category_id', 'Category is required')
        ->required('title', 'Title is required')
        ->minLength('title', 10, 'Title must be at least 10 characters')
        ->maxLength('title', 200, 'Title cannot exceed 200 characters')
        ->required('description', 'Description is required')
        ->minLength('description', 50, 'Description must be at least 50 characters')
        ->required('budget', 'Budget is required')
        ->numeric('budget', 'Budget must be a number');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create demand
    $demandId = $demand->create($data);
    
    if (!$demandId) {
        Response::error("Failed to create demand");
    }
    
    $newDemand = $demand->getById($demandId);
    Response::success($newDemand, "Demand created successfully", 201);
}

function getDemands($demand) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'status' => $_GET['status'] ?? null,
        'category_id' => $_GET['category_id'] ?? null,
        'user_id' => $_GET['user_id'] ?? null,
        'search' => $_GET['search'] ?? null,
        'min_budget' => $_GET['min_budget'] ?? null,
        'max_budget' => $_GET['max_budget'] ?? null,
        'urgency' => $_GET['urgency'] ?? null
    ];
    
    $result = $demand->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['demands'], $page, $perPage, $result['total']);
}

function getDemand($id, $demand) {
    $demandData = $demand->getById($id);
    
    if (!$demandData) {
        Response::notFound("Demand not found");
    }
    
    Response::success($demandData);
}

function getRecent($demand) {
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $demands = $demand->getRecent($limit);
    Response::success($demands);
}

function getExpiring($demand) {
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $demands = $demand->getExpiringSoon($days, $limit);
    Response::success($demands);
}

function getStats($demand) {
    $stats = [
        'total' => $demand->getCount(),
        'open' => $demand->getCount(['status' => 'open']),
        'in_progress' => $demand->getCount(['status' => 'in_progress']),
        'completed' => $demand->getCount(['status' => 'completed']),
        'closed' => $demand->getCount(['status' => 'closed'])
    ];
    
    Response::success($stats);
}

function createDemand($demand, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate input
    $validator = new Validator($data);
    $validator
        ->required('user_id', 'User ID is required')
        ->required('category_id', 'Category ID is required')
        ->required('title', 'Title is required')
        ->minLength('title', 3, 'Title must be at least 3 characters')
        ->maxLength('title', 200, 'Title cannot exceed 200 characters')
        ->required('description', 'Description is required')
        ->minLength('description', 10, 'Description must be at least 10 characters')
        ->required('budget', 'Budget is required')
        ->numeric('budget', 'Budget must be a number');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create demand
    $demandId = $demand->create($data);
    
    if (!$demandId) {
        Response::error("Failed to create demand");
    }
    
    // Log activity
    $auth->logActivity('create', 'demand', $demandId, ['title' => $data['title']]);
    
    $newDemand = $demand->getById($demandId);
    Response::success($newDemand, "Demand created successfully", 201);
}

function updateDemand($id, $demand, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if demand exists
    $existingDemand = $demand->getById($id);
    if (!$existingDemand) {
        Response::notFound("Demand not found");
    }
    
    // Validate input
    $validator = new Validator($data);
    
    if (isset($data['title'])) {
        $validator->minLength('title', 3, 'Title must be at least 3 characters')
                  ->maxLength('title', 200, 'Title cannot exceed 200 characters');
    }
    if (isset($data['description'])) {
        $validator->minLength('description', 10, 'Description must be at least 10 characters');
    }
    if (isset($data['budget'])) {
        $validator->numeric('budget', 'Budget must be a number');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update demand
    if (!$demand->update($id, $data)) {
        Response::error("Failed to update demand");
    }
    
    // Log activity
    $auth->logActivity('update', 'demand', $id, ['changes' => array_keys($data)]);
    
    $updatedDemand = $demand->getById($id);
    Response::success($updatedDemand, "Demand updated successfully");
}

function updateDemandStatus($id, $demand, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator->required('status', 'Status is required')
              ->in('status', ['open', 'in_progress', 'completed', 'closed', 'cancelled'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingDemand = $demand->getById($id);
    if (!$existingDemand) {
        Response::notFound("Demand not found");
    }
    
    if (!$demand->updateStatus($id, $data['status'])) {
        Response::error("Failed to update demand status");
    }
    
    $auth->logActivity('status_change', 'demand', $id, [
        'old_status' => $existingDemand['status'],
        'new_status' => $data['status']
    ]);
    
    Response::success(['status' => $data['status']], "Demand status updated successfully");
}

function deleteDemand($id, $demand, $auth) {
    $existingDemand = $demand->getById($id);
    if (!$existingDemand) {
        Response::notFound("Demand not found");
    }
    
    if (!$demand->delete($id)) {
        Response::error("Failed to delete demand");
    }
    
    $auth->logActivity('delete', 'demand', $id, ['title' => $existingDemand['title']]);
    
    Response::success(null, "Demand deleted successfully");
}

function proposeDemand($demand, $db) {
    // 1. Authenticate User
    $token = JWT::getTokenFromHeader();
    if (!$token) Response::unauthorized("Authentication required");
    $payload = JWT::decode($token);
    if (!$payload || !isset($payload['user_id'])) Response::unauthorized("Invalid token");
    $proposerId = $payload['user_id'];

    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['demand_id'])) Response::error("Demand ID is required");
    
    // 2. Get Demand details to find Owner
    $demandId = $data['demand_id']; 
    $demandData = $demand->getById($demandId);
    if (!$demandData) Response::notFound("Demand not found");
    
    // 3. Prevent self-proposal
    if ($demandData['user_id'] == $proposerId) {
        Response::error("You cannot propose yourself for your own demand");
    }

    // 4. Create Notification for Owner
    require_once __DIR__ . '/../models/Notification.php';
    $notification = new Notification($db);
    
    // Fetch proposer name for better message
    $user = new User($db);
    $proposer = $user->getById($proposerId);
    $proposerName = $proposer['full_name'] ?? $proposer['username'] ?? 'A user';

    $notifData = [
        'user_id' => $demandData['user_id'], // Owner
        'type' => Notification::TYPE_DEMAND,
        'category' => Notification::CATEGORY_INFO,
        'title' => 'New Proposal Received',
        'message' => "{$proposerName} has proposed themselves for your demand: \"{$demandData['title']}\"",
        'data' => [
            'demand_id' => $demandId, 
            'proposer_id' => $proposerId
        ],
        'action_url' => "/swapie-app/demand-detail?id={$demandId}",
        'action_text' => 'View Demand'
    ];
    
    if ($notification->create($notifData)) {
        Response::success([], "Proposal sent successfully! The client has been notified.");
    } else {
        Response::error("Failed to send proposal notification");
    }
}

/**
 * User-facing: Delete own demand (with user token auth)
 */
function userDeleteDemand($demand, $db) {
    $token = JWT::getTokenFromHeader();
    if (!$token) {
        Response::unauthorized("Authentication required");
    }

    $payload = JWT::decode($token);
    if (!$payload || !isset($payload['user_id'])) {
        Response::unauthorized("Invalid token");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $demandIdToDelete = $data['demand_id'] ?? null;

    if (!$demandIdToDelete) {
        Response::error("Demand ID is required");
    }

    $existingDemand = $demand->getById($demandIdToDelete);
    if (!$existingDemand) {
        Response::notFound("Demand not found");
    }

    // Ensure the user owns this demand
    if ($existingDemand['user_id'] != $payload['user_id']) {
        Response::forbidden("You can only delete your own demands");
    }

    if (!$demand->delete($demandIdToDelete)) {
        Response::error("Failed to delete demand");
    }

    Response::success(null, "Demand deleted successfully");
}
