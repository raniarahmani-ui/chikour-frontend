<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/UserAuthMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $db = $database->getConnection();

    $auth = new UserAuthMiddleware($db);
    $currentUser = $auth->authenticate();

    if ($method === 'GET') {
        getProfile($db, $currentUser['id']);
    } elseif ($method === 'POST') {
        updateProfile($db, $currentUser['id']);
    } else {
        Response::methodNotAllowed();
    }
} catch (Exception $e) {
    Response::error("Server Error: " . $e->getMessage(), 500);
}

function updateProfile($db, $userId) {
    $data = json_decode(file_get_contents("php://input"), true);
    require_once __DIR__ . '/../models/User.php';
    $userModel = new User($db);

    if (empty($data['full_name'])) {
        $currentUserRaw = $userModel->getById($userId);
        $data['full_name'] = $currentUserRaw['full_name'] ?? $currentUserRaw['username'];
    }

    $updateData = [
        'full_name' => $data['full_name'],
        'email' => $data['email'] ?? null,
        'skills' => $data['skills'] ?? null,
        'updated_at' => date('Y-m-d H:i:s')
    ];

    if (isset($data['phone'])) {
        $updateData['phone'] = $data['phone'];
    }
    if (isset($data['bio'])) {
        $updateData['bio'] = $data['bio'];
    }
    if (isset($data['username'])) {
        $updateData['username'] = $data['username'];
    }

    if (!empty($data['password'])) {
        $updateData['password'] = $data['password'];
    }

    if ($userModel->update($userId, $updateData)) {
        // Return the updated user so frontend can refresh localStorage
        $updatedUser = $userModel->getById($userId);
        unset($updatedUser['password']);
        Response::success(['user' => $updatedUser], "Profile updated successfully");
    } else {
        Response::error("Failed to update profile");
    }
}

function getProfile($db, $userId) {
    $userQuery = "SELECT id, username, email, full_name, phone, bio, skills,
                         profile_image, is_verified, coins, rating, total_ratings,
                         created_at, updated_at
                  FROM users
                  WHERE id = :id
                  LIMIT 1";
    $stmt = $db->prepare($userQuery);
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        Response::notFound("User not found");
    }

    // Cast numeric fields
    $user['coins'] = (int)($user['coins'] ?? 0);
    $user['total_ratings'] = (int)($user['total_ratings'] ?? 0);
    $user['rating'] = (float)($user['rating'] ?? 0);

    $servicesCount = fetchCount($db, "SELECT COUNT(*) FROM services WHERE user_id = :id AND status != 'deleted'", $userId);
    $demandsCount = fetchCount($db, "SELECT COUNT(*) FROM demands WHERE user_id = :id AND status != 'deleted'", $userId);
    $sessionsCount = fetchCount($db, 
        "SELECT COUNT(*) FROM transactions WHERE (from_user_id = :id1 OR to_user_id = :id2) AND status = 'completed'", 
        ['id1' => $userId, 'id2' => $userId]
    );

    // Calculate Lifetime Stats
    // 1. Total Earned: Income from work (service/demand payments)
    $totalEarned = fetchCount($db, "SELECT SUM(coins) FROM transactions WHERE to_user_id = :id AND status = 'completed' AND type IN ('service_payment', 'demand_payment')", $userId);
    
    // 2. Total Purchased: Coins bought by the user
    $totalPurchased = fetchCount($db, "SELECT SUM(coins) FROM transactions WHERE to_user_id = :id AND status = 'completed' AND type = 'purchase'", $userId);

    // 3. Total Spent: Amount spent on other's services
    $totalSpent = fetchCount($db, "SELECT SUM(coins) FROM transactions WHERE from_user_id = :id AND status = 'completed' AND type IN ('service_payment', 'demand_payment')", $userId);

    Response::success([
        'user' => $user,
        'stats' => [
            'services' => (int)$servicesCount,
            'demands' => (int)$demandsCount,
            'sessions' => (int)$sessionsCount,
            'total_earned' => (int)$totalEarned,
            'total_spent' => (int)$totalSpent,
            'total_purchased' => (int)$totalPurchased,
            'balance' => (int)$user['coins']
        ],
        'services' => fetchServices($db, $userId),
        'orders' => fetchOrders($db, $userId),
        'demands' => fetchDemands($db, $userId)
    ]);
}

function fetchCount($db, $sql, $params) {
    $stmt = $db->prepare($sql);
    if (!is_array($params)) $params = ['id' => $params];
    $stmt->execute($params);
    return (int)$stmt->fetchColumn() ?: 0;
}

function fetchServices($db, $userId) {
    $query = "SELECT s.id, s.title, s.description, s.price, s.status, s.images, s.created_at,
                     c.name as category_name
              FROM services s
              LEFT JOIN categories c ON s.category_id = c.id
              WHERE s.user_id = :id AND s.status != 'deleted'
              ORDER BY s.created_at DESC LIMIT 20";
    $stmt = $db->prepare($query);
    $stmt->execute(['id' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchDemands($db, $userId) {
    $query = "SELECT d.id, d.title, d.description, d.budget, d.status, d.created_at,
                     c.name as category_name
              FROM demands d
              LEFT JOIN categories c ON d.category_id = c.id
              WHERE d.user_id = :id AND d.status != 'deleted'
              ORDER BY d.created_at DESC LIMIT 20";
    $stmt = $db->prepare($query);
    $stmt->execute(['id' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function fetchOrders($db, $userId) {
    $query = "SELECT t.id, t.type, t.coins, t.status, t.created_at, t.service_id, t.demand_id, t.notes,
                     s.title as service_title, d.title as demand_title
              FROM transactions t
              LEFT JOIN services s ON t.service_id = s.id
              LEFT JOIN demands d ON t.demand_id = d.id
              WHERE t.from_user_id = :id AND t.type = 'purchase'
              ORDER BY t.created_at DESC LIMIT 20";
    $stmt = $db->prepare($query);
    $stmt->execute(['id' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

