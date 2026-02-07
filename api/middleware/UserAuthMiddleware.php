<?php

require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Response.php';

class UserAuthMiddleware {
    private $conn;
    private $user;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function authenticate() {
        $token = JWT::getTokenFromHeader();

        if (!$token) {
            Response::unauthorized("No authentication token provided");
        }

        $payload = JWT::decode($token);

        if (!$payload || !isset($payload['user_id']) || ($payload['type'] ?? '') !== 'user') {
            Response::unauthorized("Invalid or expired token");
        }

        $query = "SELECT id, username, email, full_name, phone, bio, skills,
                         profile_image, is_verified, coins, rating, total_ratings,
                         created_at, updated_at
                  FROM users
                  WHERE id = :id AND is_active = 1
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $payload['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            Response::unauthorized("User account not found or inactive");
        }

        $this->user = $user;
        return $this->user;
    }

    public function getUser() {
        return $this->user;
    }
}
