<?php
// backend/api/amanda/reset_password.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$code = $data['code'] ?? '';
$password = $data['password'] ?? '';

if (!$email || !$code || !$password) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit;
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT id, reset_code_hash, reset_code_expires FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !$user['reset_code_hash'] || strtotime($user['reset_code_expires']) < time()) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired code.']);
    exit;
}

if (!password_verify($code, $user['reset_code_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Incorrect code.']);
    exit;
}

$newHash = password_hash($password, PASSWORD_DEFAULT);
$update = $db->prepare("UPDATE users SET password = :p, reset_code_hash = NULL, reset_code_expires = NULL WHERE id = :id");
$update->execute(['p' => $newHash, 'id' => $user['id']]);

echo json_encode(['success' => true, 'message' => 'Password reset successful!']);
