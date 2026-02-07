<?php

 // Admins API Endpoints

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/Admin.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate
$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

// Checking if the current admin is super_admin (we have admins and super admin)
if ($currentAdmin['role'] !== 'super_admin') {
    Response::forbidden("Only super admins can manage admins");
}

$method = $_SERVER['REQUEST_METHOD'];
$admin = new Admin($db);

// Parse URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/admins\/(\d+)/', $path, $matches);
$adminId = $matches[1] ?? null;

// Check for action
preg_match('/\/admins\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;

// Check for activity logs endpoint
if (strpos($path, '/admins/activity-logs') !== false) {
    getActivityLogs($admin);
}

switch ($method) {
    case 'GET':
        if ($adminId) {
            getAdmin($adminId, $admin);
        } else {
            getAdmins($admin);
        }
        break;
    case 'POST':
        createAdmin($admin, $auth, $currentAdmin);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$adminId) {
            Response::error("Admin ID is required");
        }
        if ($action === 'status') {
            updateAdminStatus($adminId, $admin, $auth, $currentAdmin);
        } else {
            updateAdmin($adminId, $admin, $auth, $currentAdmin);
        }
        break;
    case 'DELETE':
        if (!$adminId) {
            Response::error("Admin ID is required");
        }
        deleteAdmin($adminId, $admin, $auth, $currentAdmin);
        break;
    default:
        Response::methodNotAllowed();
}

function getAdmins($admin) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'status' => $_GET['status'] ?? null,
        'role' => $_GET['role'] ?? null,
        'search' => $_GET['search'] ?? null
    ];
    
    $result = $admin->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['admins'], $page, $perPage, $result['total']);
}

function getAdmin($id, $admin) {
    $adminData = $admin->getById($id);
    
    if (!$adminData) {
        Response::notFound("Admin not found");
    }
    
    Response::success($adminData);
}

function getActivityLogs($admin) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'admin_id' => $_GET['admin_id'] ?? null,
        'action' => $_GET['action'] ?? null,
        'entity_type' => $_GET['entity_type'] ?? null
    ];
    
    $result = $admin->getActivityLogs($page, $perPage, array_filter($filters));
    
    Response::paginated($result['logs'], $page, $perPage, $result['total']);
}

function createAdmin($admin, $auth, $currentAdmin) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate input
    $validator = new Validator($data);
    $validator
        ->required('username', 'Username is required')
        ->minLength('username', 3, 'Username must be at least 3 characters')
        ->maxLength('username', 50, 'Username cannot exceed 50 characters')
        ->required('email', 'Email is required')
        ->email('email', 'Invalid email format')
        ->required('password', 'Password is required')
        ->minLength('password', 8, 'Password must be at least 8 characters')
        ->required('full_name', 'Full name is required');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if email exists
    if ($admin->emailExists($data['email'])) {
        Response::error("Email already exists", 409);
    }
    
    // Check if username exists
    if ($admin->usernameExists($data['username'])) {
        Response::error("Username already exists", 409);
    }
    
    // Create admin
    $adminId = $admin->create($data);
    
    if (!$adminId) {
        Response::error("Failed to create admin");
    }
    
    // Log activity
    $auth->logActivity('create', 'admin', $adminId, [
        'username' => $data['username'],
        'created_by' => $currentAdmin['id']
    ]);
    
    $newAdmin = $admin->getById($adminId);
    Response::success($newAdmin, "Admin created successfully", 201);
}

function updateAdmin($id, $admin, $auth, $currentAdmin) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if admin exists
    $existingAdmin = $admin->getById($id);
    if (!$existingAdmin) {
        Response::notFound("Admin not found");
    }
    
    // Prevent self-demotion from super_admin
    if ($id == $currentAdmin['id'] && isset($data['role']) && $data['role'] !== 'super_admin') {
        Response::error("Cannot demote yourself from super admin");
    }
    
    // Validate input
    $validator = new Validator($data);
    
    if (isset($data['username'])) {
        $validator->minLength('username', 3, 'Username must be at least 3 characters');
    }
    if (isset($data['email'])) {
        $validator->email('email', 'Invalid email format');
    }
    if (isset($data['password'])) {
        $validator->minLength('password', 8, 'Password must be at least 8 characters');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check unique constraints
    if (isset($data['email']) && $admin->emailExists($data['email'], $id)) {
        Response::error("Email already exists", 409);
    }
    if (isset($data['username']) && $admin->usernameExists($data['username'], $id)) {
        Response::error("Username already exists", 409);
    }
    
    // Update admin
    if (!$admin->update($id, $data)) {
        Response::error("Failed to update admin");
    }
    
    // Log activity
    $auth->logActivity('update', 'admin', $id, [
        'changes' => array_keys($data),
        'updated_by' => $currentAdmin['id']
    ]);
    
    $updatedAdmin = $admin->getById($id);
    Response::success($updatedAdmin, "Admin updated successfully");
}

function updateAdminStatus($id, $admin, $auth, $currentAdmin) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Prevent self-deactivation
    if ($id == $currentAdmin['id']) {
        Response::error("Cannot change your own status");
    }
    
    $validator = new Validator($data);
    $validator->required('status', 'Status is required')
              ->in('status', ['active', 'inactive', 'suspended'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingAdmin = $admin->getById($id);
    if (!$existingAdmin) {
        Response::notFound("Admin not found");
    }
    
    if (!$admin->update($id, ['status' => $data['status']])) {
        Response::error("Failed to update admin status");
    }
    
    $auth->logActivity('status_change', 'admin', $id, [
        'old_status' => $existingAdmin['status'],
        'new_status' => $data['status'],
        'changed_by' => $currentAdmin['id']
    ]);
    
    Response::success(['status' => $data['status']], "Admin status updated successfully");
}

function deleteAdmin($id, $admin, $auth, $currentAdmin) {
    // Prevent self-deletion
    if ($id == $currentAdmin['id']) {
        Response::error("Cannot delete yourself");
    }
    
    $existingAdmin = $admin->getById($id);
    if (!$existingAdmin) {
        Response::notFound("Admin not found");
    }
    
    if (!$admin->delete($id)) {
        Response::error("Failed to delete admin");
    }
    
    $auth->logActivity('delete', 'admin', $id, [
        'username' => $existingAdmin['username'],
        'deleted_by' => $currentAdmin['id']
    ]);
    
    Response::success(null, "Admin deleted successfully");
}
