<?php
// Admin management of services + User endpoints

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../models/Service.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$service = new Service($db);

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/services\/(\d+)/', $path, $matches);
$serviceId = $matches[1] ?? null;

// Checking for action
preg_match('/\/services\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;

// ── User-facing endpoints (before admin auth) ──

// User: Create service
if (strpos($path, '/services/create') !== false && $method === 'POST') {
    userCreateService($service, $db);
    exit;
}

// User: Delete own service
if (strpos($path, '/services/user-delete') !== false && $method === 'POST') {
    userDeleteService($service, $db);
    exit;
}

// Checking for stats endpoint (public)
if (strpos($path, '/services/stats') !== false) {
    getStats($service);
}

if (strpos($path, '/services/recent') !== false) {
    getRecent($service);
}

// ── Admin endpoints (require admin auth) ──
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

switch ($method) {
    case 'GET':
        if ($serviceId) {
            getService($serviceId, $service);
        } else {
            getServices($service);
        }
        break;
    case 'POST':
        createService($service, $auth);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$serviceId) {
            Response::error("Service ID is required");
        }
        if ($action === 'status') {
            updateServiceStatus($serviceId, $service, $auth);
        } else {
            updateService($serviceId, $service, $auth);
        }
        break;
    case 'DELETE':
        if (!$serviceId) {
            Response::error("Service ID is required");
        }
        deleteService($serviceId, $service, $auth);
        break;
    default:
        Response::methodNotAllowed();
}

function getServices($service) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'status' => $_GET['status'] ?? null,
        'category_id' => $_GET['category_id'] ?? null,
        'user_id' => $_GET['user_id'] ?? null,
        'search' => $_GET['search'] ?? null,
        'min_price' => $_GET['min_price'] ?? null,
        'max_price' => $_GET['max_price'] ?? null
    ];
    
    $result = $service->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['services'], $page, $perPage, $result['total']);
}

function getService($id, $service) {
    $serviceData = $service->getById($id);
    
    if (!$serviceData) {
        Response::notFound("Service not found");
    }
    
    Response::success($serviceData);
}

function getRecent($service) {
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $services = $service->getRecent($limit);
    Response::success($services);
}

function getStats($service) {
    $stats = [
        'total' => $service->getCount(),
        'active' => $service->getCount(['status' => 'active']),
        'pending' => $service->getCount(['status' => 'pending']),
        'inactive' => $service->getCount(['status' => 'inactive'])
    ];
    
    Response::success($stats);
}

function createService($service, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator
        ->required('user_id', 'User ID is required')
        ->required('category_id', 'Category ID is required')
        ->required('title', 'Title is required')
        ->minLength('title', 3, 'Title must be at least 3 characters')
        ->maxLength('title', 200, 'Title cannot exceed 200 characters')
        ->required('description', 'Description is required')
        ->minLength('description', 10, 'Description must be at least 10 characters')
        ->required('price', 'Price is required')
        ->numeric('price', 'Price must be a number');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create a service
    $serviceId = $service->create($data);
    
    if (!$serviceId) {
        Response::error("Failed to create service");
    }

    $auth->logActivity('create', 'service', $serviceId, ['title' => $data['title']]);
    
    $newService = $service->getById($serviceId);
    Response::success($newService, "Service created successfully", 201);
}

function updateService($id, $service, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);

    $existingService = $service->getById($id);
    if (!$existingService) {
        Response::notFound("Service not found");
    }

    $validator = new Validator($data);
    
    if (isset($data['title'])) {
        $validator->minLength('title', 3, 'Title must be at least 3 characters')
                  ->maxLength('title', 200, 'Title cannot exceed 200 characters');
    }
    if (isset($data['description'])) {
        $validator->minLength('description', 10, 'Description must be at least 10 characters');
    }
    if (isset($data['price'])) {
        $validator->numeric('price', 'Price must be a number');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    if (!$service->update($id, $data)) {
        Response::error("Failed to update service");
    }
    
    $auth->logActivity('update', 'service', $id, ['changes' => array_keys($data)]);
    
    $updatedService = $service->getById($id);
    Response::success($updatedService, "Service updated successfully");
}

function updateServiceStatus($id, $service, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator->required('status', 'Status is required')
              ->in('status', ['active', 'inactive', 'pending', 'rejected'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingService = $service->getById($id);
    if (!$existingService) {
        Response::notFound("Service not found");
    }
    
    if (!$service->updateStatus($id, $data['status'])) {
        Response::error("Failed to update service status");
    }
    
    $auth->logActivity('status_change', 'service', $id, [
        'old_status' => $existingService['status'],
        'new_status' => $data['status']
    ]);
    
    Response::success(['status' => $data['status']], "Service status updated successfully");
}

function deleteService($id, $service, $auth) {
    $existingService = $service->getById($id);
    if (!$existingService) {
        Response::notFound("Service not found");
    }
    
    if (!$service->delete($id)) {
        Response::error("Failed to delete service");
    }
    
    $auth->logActivity('delete', 'service', $id, ['title' => $existingService['title']]);
    
    Response::success(null, "Service deleted successfully");
}

/**
 * User-facing: Create service (with user token auth)
 */
function userCreateService($service, $db) {
    require_once __DIR__ . '/../utils/JWT.php';
    require_once __DIR__ . '/../models/User.php';

    $token = JWT::getTokenFromHeader();
    if (!$token) {
        Response::unauthorized("Authentication required");
    }

    $payload = JWT::decode($token);
    if (!$payload || !isset($payload['user_id'])) {
        Response::unauthorized("Invalid token");
    }

    $user = new User($db);
    $userData = $user->getById($payload['user_id']);
    if (!$userData || !$userData['is_active']) {
        Response::unauthorized("User account is not active");
    }

    // Handle both JSON and FormData
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $data = $_POST;
    } else {
        $data = json_decode(file_get_contents("php://input"), true);
    }

    // Force user_id from token
    $data['user_id'] = $payload['user_id'];

    // Map frontend field names to DB field names
    if (isset($data['coin_price']) && !isset($data['price'])) {
        $data['price'] = intval($data['coin_price']);
        unset($data['coin_price']);
    }
    if (isset($data['price'])) {
        $data['price'] = intval($data['price']);
    }

    $validator = new Validator($data);
    $validator
        ->required('category_id', 'Category is required')
        ->required('title', 'Title is required')
        ->minLength('title', 3, 'Title must be at least 3 characters')
        ->maxLength('title', 200, 'Title cannot exceed 200 characters')
        ->required('description', 'Description is required')
        ->minLength('description', 10, 'Description must be at least 10 characters');

    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Handle file upload(s) if present
    $uploadedPaths = [];

    // Multiple files via media[]
    if (isset($_FILES['media']) && is_array($_FILES['media']['name'])) {
        $uploadDir = __DIR__ . '/../uploads/services/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileCount = count($_FILES['media']['name']);
        for ($i = 0; $i < $fileCount; $i++) {
            if ($_FILES['media']['error'][$i] === UPLOAD_ERR_OK) {
                $filename = uniqid() . '_' . basename($_FILES['media']['name'][$i]);
                $targetPath = $uploadDir . $filename;
                if (move_uploaded_file($_FILES['media']['tmp_name'][$i], $targetPath)) {
                    $uploadedPaths[] = 'uploads/services/' . $filename;
                }
            }
        }
    }

    // Legacy single file via image field
    if (empty($uploadedPaths) && isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../uploads/services/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $filename = uniqid() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            $uploadedPaths[] = 'uploads/services/' . $filename;
        }
    }

    if (!empty($uploadedPaths)) {
        $data['images'] = $uploadedPaths;
    }

    $serviceId = $service->create($data);

    if (!$serviceId) {
        Response::error("Failed to create service");
    }

    $newService = $service->getById($serviceId);
    Response::success($newService, "Service created successfully", 201);
}

/**
 * User-facing: Delete own service (with user token auth)
 */
function userDeleteService($service, $db) {
    require_once __DIR__ . '/../utils/JWT.php';
    require_once __DIR__ . '/../models/User.php';

    $token = JWT::getTokenFromHeader();
    if (!$token) {
        Response::unauthorized("Authentication required");
    }

    $payload = JWT::decode($token);
    if (!$payload || !isset($payload['user_id'])) {
        Response::unauthorized("Invalid token");
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $serviceIdToDelete = $data['service_id'] ?? null;

    if (!$serviceIdToDelete) {
        Response::error("Service ID is required");
    }

    $existingService = $service->getById($serviceIdToDelete);
    if (!$existingService) {
        Response::notFound("Service not found");
    }

    // Ensure the user owns this service
    if ($existingService['user_id'] != $payload['user_id']) {
        Response::forbidden("You can only delete your own services");
    }

    if (!$service->delete($serviceIdToDelete)) {
        Response::error("Failed to delete service");
    }

    Response::success(null, "Service deleted successfully");
}
