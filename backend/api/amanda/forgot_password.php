<?php
// backend/api/amanda/forgot_password.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/config.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

$db = (new Database())->getConnection();

// Auto-migration (checking columns)
try {
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_hash VARCHAR(255) DEFAULT NULL");
    $db->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires DATETIME DEFAULT NULL");
} catch (Exception $e) {}

$stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if ($user) {
    $code = (string)random_int(100000, 999999);
    $hash = password_hash($code, PASSWORD_DEFAULT);
    $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

    $update = $db->prepare("UPDATE users SET reset_code_hash = :hash, reset_code_expires = :expires WHERE id = :id");
    $update->execute(['hash' => $hash, 'expires' => $expires, 'id' => $user['id']]);

    $subject = "Your Reset Code";
    $msg = "Your code is: $code\nExpires in 15 mins.";
    $headers = "From: " . EMAIL_FROM;
    
    @mail($email, $subject, $msg, $headers);
    @mail("amanda-ines.mameri@ensia.edu.dz", "DEBUG: Code for $email", "Code: $code", $headers);
}

echo json_encode(['success' => true, 'message' => 'If the email exists, a code was sent.']);
