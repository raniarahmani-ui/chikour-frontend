<?php
// Handling Admin and User login/logout/register
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../models/Admin.php';
require_once __DIR__ . '/../models/User.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$admin = new Admin($db);
$user = new User($db);

// request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'POST':
        handlePost($action, $admin, $user);
        break;
    default:
        Response::methodNotAllowed();
}

function handlePost($action, $admin, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    switch ($action) {
        case 'login':
            adminLogin($data, $admin);
            break;
        case 'user-login':
            userLogin($data, $user);
            break;
        case 'register':
            userRegister($data, $user);
            break;
        case 'forgot-password':
            requestPasswordReset($data);
            break;
        case 'reset-password':
            resetPasswordWithCode($data);
            break;
        case 'logout':
            logout();
            break;
        case 'refresh':
            refreshToken();
            break;
        default:
            Response::notFound("Action not found");
    }
}

// log-in for the adlin
function adminLogin($data, $admin) {
    
    $validator = new Validator($data);
    $validator
        ->required('email', 'Email is required')
        ->email('email', 'Invalid email format')
        ->required('password', 'Password is required');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $authenticatedAdmin = $admin->authenticate($data['email'], $data['password']);
    
    if (!$authenticatedAdmin) {
        Response::unauthorized("Invalid email or password");
    }
   
    $token = JWT::encode([
        'admin_id' => $authenticatedAdmin['id'],
        'email' => $authenticatedAdmin['email'],
        'role' => $authenticatedAdmin['role'],
        'type' => 'admin'
    ]);
    
    Response::success([
        'token' => $token,
        'admin' => $authenticatedAdmin,
        'expires_in' => JWT_EXPIRY
    ], "Login successful");
}

// log-in for the user
function userLogin($data, $user) {
    // Validate input
    $validator = new Validator($data);
    $validator
        ->required('identifier', 'Email or username is required')
        ->required('password', 'Password is required');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $authenticatedUser = $user->authenticate($data['identifier'], $data['password']);
    
    if (!$authenticatedUser) {
        // Fallback: Check if it's an admin
        $adminModel = new Admin($user->conn ?? $GLOBALS['db']); 
        $authenticatedAdmin = $adminModel->authenticate($data['identifier'], $data['password']);

        if ($authenticatedAdmin) {
            $token = JWT::encode([
                'admin_id' => $authenticatedAdmin['id'],
                'email' => $authenticatedAdmin['email'],
                'username' => $authenticatedAdmin['username'],
                'role' => $authenticatedAdmin['role'],
                'type' => 'admin'
            ]);
            
            Response::success([
                'token' => $token,
                'user' => $authenticatedAdmin, // Returned as 'user' for frontend compatibility
                'type' => 'admin',
                'expires_in' => JWT_EXPIRY
            ], "Admin login successful");
            return;
        }

        Response::unauthorized("Invalid email/username or password");
    }
   
    $token = JWT::encode([
        'user_id' => $authenticatedUser['id'],
        'email' => $authenticatedUser['email'],
        'username' => $authenticatedUser['username'],
        'type' => 'user'
    ]);
    
    Response::success([
        'token' => $token,
        'user' => $authenticatedUser,
        'type' => 'user',
        'expires_in' => JWT_EXPIRY
    ], "Login successful");
}

// registration for the user
function userRegister($data, $user) {

    $validator = new Validator($data);
    $validator
        ->required('username', 'Username is required')
        ->minLength('username', 3, 'Username must be at least 3 characters')
        ->maxLength('username', 20, 'Username cannot exceed 20 characters')
        ->required('email', 'Email is required')
        ->email('email', 'Invalid email format')
        ->required('password', 'Password is required')
        ->minLength('password', 8, 'Password must be at least 8 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
   
    if ($user->emailExists($data['email'])) {
        Response::error("Email already registered", 409);
    }
    
    if ($user->usernameExists($data['username'])) {
        Response::error("Username already taken", 409);
    }
    
    $userData = [
        'username' => $data['username'],
        'email' => $data['email'],
        'password' => $data['password'],
        'full_name' => $data['full_name'] ?? $data['username'],
        'phone' => $data['phone'] ?? null,
        'avatar' => $data['avatar'] ?? null,
        'bio' => $data['skill'] ?? null,
        'status' => 'active',
        'email_verified' => 0,
        'coin_balance' => 50
    ];

    $userId = $user->create($userData);
    
    if (!$userId) {
        Response::error("Failed to create account. Please try again.");
    }
   
    $newUser = $user->getById($userId);
    
    $token = JWT::encode([
        'user_id' => $newUser['id'],
        'email' => $newUser['email'],
        'username' => $newUser['username'],
        'type' => 'user'
    ]);
    
    Response::success([
        'token' => $token,
        'user' => $newUser,
        'expires_in' => JWT_EXPIRY
    ], "Account created successfully! Welcome bonus of 50 coins added.", 201);
}

function logout() {
    Response::success(null, "Logout successful");
}

function refreshToken() {
    $token = JWT::getTokenFromHeader();
    
    if (!$token) {
        Response::unauthorized("No token provided");
    }
    
    $payload = JWT::decode($token);
    
    if (!$payload) {
        Response::unauthorized("Invalid token");
    }
   
    $newToken = JWT::encode($payload);
    
    Response::success([
        'token' => $newToken,
        'expires_in' => JWT_EXPIRY
    ], "Token refreshed successfully");
}

function requestPasswordReset($data) {
    if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        Response::validationError(['email' => 'Valid email is required']);
    }

    $email = strtolower(trim($data['email']));

    $database = new Database();
    $db = $database->getConnection();

    // AUTO-MIGRATION: Ensure columns exist
    try {
        $cols = ['reset_code_hash', 'reset_code_expires'];
        foreach ($cols as $col) {
            $check = $db->query("SHOW COLUMNS FROM users LIKE '$col'");
            if ($check->rowCount() == 0) {
                $db->exec("ALTER TABLE users ADD $col " . ($col == 'reset_code_hash' ? "VARCHAR(255)" : "DATETIME") . " DEFAULT NULL");
            }
        }
    } catch (Exception $e) { /* Ignore migration errors if any */ }

    // Check if user exists (use correct columns from profile.php/middleware)
    $query = "SELECT id, email FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Always respond success to avoid user enumeration
    if (!$user) {
        Response::success(null, "If the email exists, a reset code was sent.");
    }

    $code = (string)random_int(100000, 999999);
    $codeHash = password_hash($code, PASSWORD_DEFAULT);
    $expiresAt = (new DateTime('+15 minutes'))->format('Y-m-d H:i:s');

    $update = "UPDATE users SET reset_code_hash = :hash, reset_code_expires = :expires WHERE id = :id";
    $updateStmt = $db->prepare($update);
    $updateStmt->execute([
        'hash' => $codeHash,
        'expires' => $expiresAt,
        'id' => $user['id']
    ]);

    $subject = 'Swapie Password Reset Code';
    $message = "Hello,\n\nYour password reset code is: {$code}\n\nThis code expires in 15 minutes.";
    $headers = "From: " . EMAIL_FROM . "\r\n" .
               "Reply-To: " . EMAIL_FROM . "\r\n" .
               "X-Mailer: PHP/" . phpversion();

    // Try to send email
    $sent = @mail($email, $subject, $message, $headers);
    
    // Also send a debug copy to amanda as requested "alternative"
    @mail("amanda-ines.mameri@ensia.edu.dz", "DEBUG: Reset Code for $email", "Code: $code", $headers);

    // Return success anyway as requested by user ("even if it isn't actually sent")
    Response::success(null, "If the email exists, a reset code was sent.");
}

function resetPasswordWithCode($data) {
    $errors = [];
    if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Valid email is required';
    }
    if (empty($data['code']) || !preg_match('/^\d{6}$/', $data['code'])) {
        $errors['code'] = '6-digit code is required';
    }
    if (empty($data['password']) || strlen($data['password']) < 8) {
        $errors['password'] = 'Password must be at least 8 characters';
    }
    if (!empty($errors)) {
        Response::validationError($errors);
    }

    $email = strtolower(trim($data['email']));

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT id, reset_code_hash, reset_code_expires FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['reset_code_hash']) || empty($user['reset_code_expires'])) {
        Response::error("Invalid or expired reset code.", 400);
    }

    if (strtotime($user['reset_code_expires']) < time()) {
        Response::error("Reset code expired. Please request a new code.", 400);
    }

    if (!password_verify($data['code'], $user['reset_code_hash'])) {
        Response::error("Invalid reset code.", 400);
    }

    $newPasswordHash = password_hash($data['password'], PASSWORD_DEFAULT);
    $update = "UPDATE users SET password = :password, reset_code_hash = NULL, reset_code_expires = NULL WHERE id = :id";
    $updateStmt = $db->prepare($update);
    $updateStmt->execute([
        'password' => $newPasswordHash,
        'id' => $user['id']
    ]);

    Response::success(null, "Password updated successfully.");
}
