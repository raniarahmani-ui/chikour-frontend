<?php
// Admin management of users

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/User.php';

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

$method = $_SERVER['REQUEST_METHOD'];
$user = new User($db);

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/users\/(\d+)/', $path, $matches);
$userId = $matches[1] ?? null;

preg_match('/\/users\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;


switch ($method) {
    case 'GET':
        if ($userId && $action === 'details') {
            getUserDetails($userId, $user);
        } elseif ($userId) {
            getUser($userId, $user);
        } else {
            getUsers($user);
        }
        break;
    case 'POST':
        createUser($user, $auth);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$userId) {
            Response::error("User ID is required");
        }
        if ($action === 'status') {
            updateUserStatus($userId, $user, $auth);
        } elseif ($action === 'balance') {
            adjustUserBalance($userId, $user, $auth);
        } else {
            updateUser($userId, $user, $auth);
        }
        break;
    case 'DELETE':
        if (!$userId) {
            Response::error("User ID is required");
        }
        deleteUser($userId, $user, $auth);
        break;
    default:
        Response::methodNotAllowed();
}

function getUsers($user) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'status' => $_GET['status'] ?? null,
        'search' => $_GET['search'] ?? null,
        'email_verified' => $_GET['email_verified'] ?? null
    ];
    
    $result = $user->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['users'], $page, $perPage, $result['total']);
}

function getUser($id, $user) {
    $userData = $user->getById($id);
    
    if (!$userData) {
        Response::notFound("User not found");
    }
    
    Response::success($userData);
}

function getUserDetails($id, $user) {
    $userData = $user->getDetails($id);
    
    if (!$userData) {
        Response::notFound("User not found");
    }
    
    Response::success($userData);
}

function createUser($user, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
   
    $validator = new Validator($data);
    $validator
        ->required('username', 'Username is required')
        ->minLength('username', 3, 'Username must be at least 3 characters')
        ->maxLength('username', 50, 'Username cannot exceed 50 characters')
        ->required('email', 'Email is required')
        ->email('email', 'Invalid email format')
        ->required('password', 'Password is required')
        ->minLength('password', 6, 'Password must be at least 6 characters')
        ->required('full_name', 'Full name is required');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    if ($user->emailExists($data['email'])) {
        Response::error("Email already exists", 409);
    }

    if ($user->usernameExists($data['username'])) {
        Response::error("Username already exists", 409);
    }
    
    $userId = $user->create($data);
    
    if (!$userId) {
        Response::error("Failed to create user");
    }

    $auth->logActivity('create', 'user', $userId, ['username' => $data['username']]);
    
    $newUser = $user->getById($userId);
    Response::success($newUser, "User created successfully", 201);
}

function updateUser($id, $user, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);

    $existingUser = $user->getById($id);
    if (!$existingUser) {
        Response::notFound("User not found");
    }
  
    $validator = new Validator($data);
    
    if (isset($data['username'])) {
        $validator->minLength('username', 3, 'Username must be at least 3 characters');
    }
    if (isset($data['email'])) {
        $validator->email('email', 'Invalid email format');
    }
    if (isset($data['password'])) {
        $validator->minLength('password', 6, 'Password must be at least 6 characters');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
 
    if (isset($data['email']) && $user->emailExists($data['email'], $id)) {
        Response::error("Email already exists", 409);
    }
    if (isset($data['username']) && $user->usernameExists($data['username'], $id)) {
        Response::error("Username already exists", 409);
    }

    if (!$user->update($id, $data)) {
        Response::error("Failed to update user");
    }

    $auth->logActivity('update', 'user', $id, ['changes' => array_keys($data)]);
    
    $updatedUser = $user->getById($id);
    Response::success($updatedUser, "User updated successfully");
}

function updateUserStatus($id, $user, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator->required('status', 'Status is required')
              ->in('status', ['active', 'inactive', 'suspended', 'banned'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingUser = $user->getById($id);
    if (!$existingUser) {
        Response::notFound("User not found");
    }
    
    if (!$user->update($id, ['status' => $data['status']])) {
        Response::error("Failed to update user status");
    }
    
    $auth->logActivity('status_change', 'user', $id, [
        'old_status' => $existingUser['status'],
        'new_status' => $data['status']
    ]);
    
    Response::success(['status' => $data['status']], "User status updated successfully");
}

function adjustUserBalance($id, $user, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator->required('amount', 'Amount is required')
              ->numeric('amount', 'Amount must be a number');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingUser = $user->getById($id);
    if (!$existingUser) {
        Response::notFound("User not found");
    }
    
    $oldBalance = $existingUser['coins'];
    
    if (!$user->updateCoinBalance($id, $data['amount'])) {
        Response::error("Failed to adjust balance");
    }
    
    $updatedUser = $user->getById($id);
    
    $auth->logActivity('balance_adjustment', 'user', $id, [
        'old_balance' => $oldBalance,
        'adjustment' => $data['amount'],
        'new_balance' => $updatedUser['coins'],
        'reason' => $data['reason'] ?? null
    ]);
    
    Response::success([
        'old_balance' => $oldBalance,
        'new_balance' => $updatedUser['coins']
    ], "Balance adjusted successfully");
}

function deleteUser($id, $user, $auth) {
    $existingUser = $user->getById($id);
    if (!$existingUser) {
        Response::notFound("User not found");
    }
    
    if (!$user->delete($id)) {
        Response::error("Failed to delete user");
    }
    
    $auth->logActivity('delete', 'user', $id, ['username' => $existingUser['username']]);
    
    Response::success(null, "User deleted successfully");
}
