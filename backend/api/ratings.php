<?php
/**
 * Ratings API
 * Service ratings and reviews
 * 
 * Endpoints:
 * POST   /api/ratings                    - Create a new rating
 * GET    /api/ratings                    - List all ratings (admin)
 * GET    /api/ratings/{id}               - Get rating details
 * GET    /api/ratings/service/{id}       - Get ratings for a service
 * GET    /api/ratings/user/{id}          - Get ratings by a user
 * GET    /api/ratings/provider/{id}      - Get ratings received by provider
 * GET    /api/ratings/my                 - Get current user's ratings
 * PUT    /api/ratings/{id}               - Update own rating
 * DELETE /api/ratings/{id}               - Delete own rating
 * POST   /api/ratings/{id}/helpful       - Vote rating as helpful
 * POST   /api/ratings/{id}/response      - Provider responds to rating
 * PUT    /api/ratings/{id}/status        - Update rating status (admin)
 * PUT    /api/ratings/{id}/feature       - Toggle featured status (admin)
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
require_once __DIR__ . '/../models/Rating.php';
require_once __DIR__ . '/../models/Notification.php';

// Initialize error handler
ErrorHandler::init();

$database = new Database();
$db = $database->getConnection();
$rating = new Rating($db);
$notification = new Notification($db);
$jwt = new JWT();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parse the path
$basePath = '/api/ratings';
$path = parse_url($uri, PHP_URL_PATH);
$path = str_replace($basePath, '', $path);
$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

// Get Authentication
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

$currentUser = null;
$isAdmin = false;

if (!empty($token)) {
    $payload = $jwt->verify($token);
    if ($payload) {
        if (isset($payload['admin_id'])) {
            $isAdmin = true;
            $currentUser = ['id' => $payload['admin_id'], 'type' => 'admin'];
        } elseif (isset($payload['user_id'])) {
            $currentUser = ['id' => $payload['user_id'], 'type' => 'user'];
        }
    }
}

try {
    switch ($method) {
        case 'GET':
            if (empty($pathParts)) {
                // GET /api/ratings - List all (admin)
                if (!$isAdmin) {
                    Response::forbidden('Admin access required');
                }
                getAllRatings($rating);
            } elseif ($pathParts[0] === 'my') {
                // GET /api/ratings/my - User's own ratings
                if (!$currentUser) {
                    Response::unauthorized('Authentication required');
                }
                getMyRatings($rating, $currentUser['id']);
            } elseif ($pathParts[0] === 'service' && isset($pathParts[1])) {
                // GET /api/ratings/service/{id}
                getServiceRatings($rating, (int)$pathParts[1]);
            } elseif ($pathParts[0] === 'user' && isset($pathParts[1])) {
                // GET /api/ratings/user/{id}
                getUserRatings($rating, (int)$pathParts[1]);
            } elseif ($pathParts[0] === 'provider' && isset($pathParts[1])) {
                // GET /api/ratings/provider/{id}
                getProviderRatings($rating, (int)$pathParts[1]);
            } elseif ($pathParts[0] === 'summary' && isset($pathParts[1])) {
                // GET /api/ratings/summary/{service_id}
                getServiceSummary($rating, (int)$pathParts[1]);
            } elseif (is_numeric($pathParts[0])) {
                // GET /api/ratings/{id}
                getRating($rating, (int)$pathParts[0]);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        case 'POST':
            if (!$currentUser) {
                Response::unauthorized('Authentication required');
            }
            
            if (empty($pathParts)) {
                // POST /api/ratings - Create rating
                createRating($rating, $notification, $currentUser['id'], $db);
            } elseif (isset($pathParts[1]) && $pathParts[1] === 'helpful') {
                // POST /api/ratings/{id}/helpful - Vote helpful
                voteHelpful($rating, (int)$pathParts[0], $currentUser['id']);
            } elseif (isset($pathParts[1]) && $pathParts[1] === 'response') {
                // POST /api/ratings/{id}/response - Provider response
                addProviderResponse($rating, (int)$pathParts[0], $currentUser['id']);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        case 'PUT':
            if (!$currentUser) {
                Response::unauthorized('Authentication required');
            }
            
            if (isset($pathParts[1])) {
                $ratingId = (int)$pathParts[0];
                
                if ($pathParts[1] === 'status') {
                    // PUT /api/ratings/{id}/status - Admin update status
                    if (!$isAdmin) {
                        Response::forbidden('Admin access required');
                    }
                    updateRatingStatus($rating, $ratingId);
                } elseif ($pathParts[1] === 'feature') {
                    // PUT /api/ratings/{id}/feature - Admin toggle featured
                    if (!$isAdmin) {
                        Response::forbidden('Admin access required');
                    }
                    toggleFeatured($rating, $ratingId);
                } else {
                    Response::notFound('Endpoint not found');
                }
            } elseif (is_numeric($pathParts[0])) {
                // PUT /api/ratings/{id} - Update own rating
                updateRating($rating, (int)$pathParts[0], $currentUser['id']);
            } else {
                Response::notFound('Endpoint not found');
            }
            break;
            
        case 'DELETE':
            if (!$currentUser) {
                Response::unauthorized('Authentication required');
            }
            
            if (isset($pathParts[0]) && is_numeric($pathParts[0])) {
                // DELETE /api/ratings/{id}
                deleteRating($rating, (int)$pathParts[0], $currentUser, $isAdmin);
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
 * Create a new rating
 */
function createRating($rating, $notification, $userId, $db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator($data ?? []);
    $validator
        ->required('service_id', 'Service ID is required')
        ->numeric('service_id', 'Invalid service ID')
        ->required('rating', 'Rating is required')
        ->numeric('rating', 'Rating must be a number')
        ->min('rating', 1, 'Rating must be at least 1')
        ->max('rating', 5, 'Rating cannot exceed 5');
    
    if (isset($data['title'])) {
        $validator->maxLength('title', 200, 'Title cannot exceed 200 characters');
    }
    
    if (isset($data['review'])) {
        $validator->maxLength('review', 5000, 'Review cannot exceed 5000 characters');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $serviceId = (int)$data['service_id'];
    
    // Check if service exists
    $checkService = $db->prepare("SELECT id, user_id, title FROM services WHERE id = :id AND status = 'active'");
    $checkService->execute(['id' => $serviceId]);
    $service = $checkService->fetch(PDO::FETCH_ASSOC);
    
    if (!$service) {
        Response::notFound('Service not found');
    }
    
    // Can't rate own service
    if ($service['user_id'] == $userId) {
        Response::error('You cannot rate your own service', 400);
    }
    
    // Check if already rated
    if ($rating->hasUserRated($userId, $serviceId)) {
        Response::error('You have already rated this service', 400);
    }
    
    // Check for verified purchase
    $isVerified = false;
    $transactionId = $rating->hasVerifiedPurchase($userId, $serviceId);
    if ($transactionId) {
        $isVerified = true;
    }
    
    $ratingData = [
        'user_id' => $userId,
        'service_id' => $serviceId,
        'transaction_id' => $transactionId ?: null,
        'rating' => (int)$data['rating'],
        'title' => $data['title'] ?? null,
        'review' => $data['review'] ?? null,
        'pros' => $data['pros'] ?? null,
        'cons' => $data['cons'] ?? null,
        'images' => $data['images'] ?? null,
        'is_verified_purchase' => $isVerified ? 1 : 0,
        'status' => 'active'
    ];
    
    $ratingId = $rating->create($ratingData);
    
    if (!$ratingId) {
        Response::error('Failed to create rating', 500);
    }
    
    // Get reviewer info for notification
    $userQuery = $db->prepare("SELECT full_name, username FROM users WHERE id = :id");
    $userQuery->execute(['id' => $userId]);
    $user = $userQuery->fetch(PDO::FETCH_ASSOC);
    $reviewerName = $user['full_name'] ?: $user['username'];
    
    // Notify service provider
    $notification->notifyNewRating(
        $service['user_id'],
        $serviceId,
        $service['title'],
        $data['rating'],
        $reviewerName
    );
    
    $newRating = $rating->getById($ratingId);
    Response::success($newRating, 'Rating submitted successfully', 201);
}

/**
 * Get all ratings (Admin)
 */
function getAllRatings($rating) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'status' => $_GET['status'] ?? null,
        'rating' => $_GET['rating'] ?? null,
        'service_id' => $_GET['service_id'] ?? null,
        'user_id' => $_GET['user_id'] ?? null,
        'search' => $_GET['search'] ?? null
    ];
    
    $result = $rating->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['ratings'], $page, $perPage, $result['total']);
}

/**
 * Get ratings for a service
 */
function getServiceRatings($rating, $serviceId) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'rating' => $_GET['rating_filter'] ?? null,
        'has_review' => isset($_GET['has_review']) ? filter_var($_GET['has_review'], FILTER_VALIDATE_BOOLEAN) : null,
        'verified_only' => isset($_GET['verified_only']) ? filter_var($_GET['verified_only'], FILTER_VALIDATE_BOOLEAN) : null,
        'sort' => $_GET['sort'] ?? 'newest' // newest, oldest, highest, lowest, helpful
    ];
    
    $result = $rating->getByService($serviceId, $page, $perPage, array_filter($filters));
    
    Response::success([
        'ratings' => $result['ratings'],
        'distribution' => $result['distribution'],
        'pagination' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total_items' => $result['total'],
            'total_pages' => ceil($result['total'] / $perPage)
        ]
    ]);
}

/**
 * Get ratings by a user
 */
function getUserRatings($rating, $userId) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $result = $rating->getByUser($userId, $page, $perPage);
    
    Response::paginated($result['ratings'], $page, $perPage, $result['total']);
}

/**
 * Get ratings received by a provider
 */
function getProviderRatings($rating, $providerId) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $result = $rating->getByProvider($providerId, $page, $perPage);
    
    Response::paginated($result['ratings'], $page, $perPage, $result['total']);
}

/**
 * Get current user's ratings
 */
function getMyRatings($rating, $userId) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $result = $rating->getByUser($userId, $page, $perPage);
    
    Response::paginated($result['ratings'], $page, $perPage, $result['total']);
}

/**
 * Get service rating summary
 */
function getServiceSummary($rating, $serviceId) {
    $summary = $rating->getServiceSummary($serviceId);
    Response::success($summary);
}

/**
 * Get single rating
 */
function getRating($rating, $id) {
    $ratingData = $rating->getById($id);
    
    if (!$ratingData) {
        Response::notFound('Rating not found');
    }
    
    Response::success($ratingData);
}

/**
 * Update own rating
 */
function updateRating($rating, $id, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $existingRating = $rating->getById($id);
    if (!$existingRating) {
        Response::notFound('Rating not found');
    }
    
    if ($existingRating['user_id'] != $userId) {
        Response::forbidden('You can only update your own ratings');
    }
    
    $validator = new Validator($data ?? []);
    
    if (isset($data['rating'])) {
        $validator
            ->numeric('rating', 'Rating must be a number')
            ->min('rating', 1, 'Rating must be at least 1')
            ->max('rating', 5, 'Rating cannot exceed 5');
    }
    
    if (isset($data['title'])) {
        $validator->maxLength('title', 200, 'Title cannot exceed 200 characters');
    }
    
    if (isset($data['review'])) {
        $validator->maxLength('review', 5000, 'Review cannot exceed 5000 characters');
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    if (!$rating->update($id, $userId, $data)) {
        Response::error('Failed to update rating', 500);
    }
    
    $updatedRating = $rating->getById($id);
    Response::success($updatedRating, 'Rating updated successfully');
}

/**
 * Delete rating
 */
function deleteRating($rating, $id, $currentUser, $isAdmin) {
    $existingRating = $rating->getById($id);
    if (!$existingRating) {
        Response::notFound('Rating not found');
    }
    
    if (!$isAdmin && $existingRating['user_id'] != $currentUser['id']) {
        Response::forbidden('You can only delete your own ratings');
    }
    
    $userId = $isAdmin ? null : $currentUser['id'];
    
    if (!$rating->delete($id, $userId)) {
        Response::error('Failed to delete rating', 500);
    }
    
    Response::success(null, 'Rating deleted successfully');
}

/**
 * Vote rating as helpful
 */
function voteHelpful($rating, $id, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $existingRating = $rating->getById($id);
    if (!$existingRating) {
        Response::notFound('Rating not found');
    }
    
    // Can't vote on own rating
    if ($existingRating['user_id'] == $userId) {
        Response::error('You cannot vote on your own rating', 400);
    }
    
    $isHelpful = isset($data['is_helpful']) ? filter_var($data['is_helpful'], FILTER_VALIDATE_BOOLEAN) : true;
    
    if (!$rating->voteHelpful($id, $userId, $isHelpful)) {
        Response::error('Failed to submit vote', 500);
    }
    
    Response::success(null, 'Vote submitted successfully');
}

/**
 * Add provider response to rating
 */
function addProviderResponse($rating, $id, $userId) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator($data ?? []);
    $validator
        ->required('response', 'Response is required')
        ->minLength('response', 10, 'Response must be at least 10 characters')
        ->maxLength('response', 2000, 'Response cannot exceed 2000 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingRating = $rating->getById($id);
    if (!$existingRating) {
        Response::notFound('Rating not found');
    }
    
    if ($existingRating['provider_id'] != $userId) {
        Response::forbidden('Only the service provider can respond to this rating');
    }
    
    if ($existingRating['provider_response']) {
        Response::error('You have already responded to this rating', 400);
    }
    
    if (!$rating->addProviderResponse($id, $userId, $data['response'])) {
        Response::error('Failed to add response', 500);
    }
    
    $updatedRating = $rating->getById($id);
    Response::success($updatedRating, 'Response added successfully');
}

/**
 * Update rating status (Admin)
 */
function updateRatingStatus($rating, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $validator = new Validator($data ?? []);
    $validator
        ->required('status', 'Status is required')
        ->inArray('status', ['active', 'hidden', 'pending', 'deleted'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    if (!$rating->getById($id)) {
        Response::notFound('Rating not found');
    }
    
    if (!$rating->updateStatus($id, $data['status'])) {
        Response::error('Failed to update rating status', 500);
    }
    
    $updatedRating = $rating->getById($id);
    Response::success($updatedRating, 'Rating status updated successfully');
}

/**
 * Toggle featured status (Admin)
 */
function toggleFeatured($rating, $id) {
    if (!$rating->getById($id)) {
        Response::notFound('Rating not found');
    }
    
    if (!$rating->toggleFeatured($id)) {
        Response::error('Failed to toggle featured status', 500);
    }
    
    $updatedRating = $rating->getById($id);
    Response::success($updatedRating, 'Featured status toggled successfully');
}
