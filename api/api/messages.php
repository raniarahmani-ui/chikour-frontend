<?php
// Handling all chat-related operations

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/JWT.php';
require_once __DIR__ . '/../utils/Validator.php';

$database = new Database();
$db = $database->getConnection();
$message = new Message($db);
$jwt = new JWT();

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Parsing the path - handle multiple base path formats
$path = parse_url($uri, PHP_URL_PATH);
$basePaths = [
    '/backend/backend/api/messages',
    '/swapie/api/messages', 
    '/backend/api/messages', 
    '/api/messages'
];
foreach ($basePaths as $basePath) {
    if (strpos($path, $basePath) === 0) {
        $path = substr($path, strlen($basePath));
        break;
    }
}
$path = trim($path, '/');
$pathParts = $path ? explode('/', $path) : [];

// Get Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

// All endpoints require authentication
if (empty($token)) {
    Response::error('Authorization token required', 401);
}

$userData = $jwt->verify($token);
if (!$userData) {
    Response::error('Invalid or expired token', 401);
}

// Get user ID - handle both user and admin tokens
$currentUserId = $userData['user_id'] ?? $userData['admin_id'] ?? $userData['id'] ?? null;
if (!$currentUserId) {
    Response::error('Invalid token payload', 401);
}

// Route handling
try {
    // getting the conversations (all) of a user 
    if ($method === 'GET' && (empty($pathParts) || $pathParts[0] === 'conversations')) {
        $conversations = $message->getUserConversations($currentUserId);
        Response::success([
            'conversations' => $conversations,
            'unread_total' => $message->getUnreadCount($currentUserId)
        ]);
    }
    
    // get the conversation with a specific user 
    elseif ($method === 'GET' && $pathParts[0] === 'conversation' && isset($pathParts[1])) {
        $partnerId = (int)$pathParts[1];
        
        if ($partnerId === $currentUserId) {
            Response::error('Cannot get conversation with yourself', 400);
        }
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 50;
        
        $result = $message->getConversation($currentUserId, $partnerId, $page, $perPage);
        
        // Marking a msg as read
        $message->markAsRead($currentUserId, $partnerId);
        
        Response::success([
            'messages' => $result['messages'],
            'total' => $result['total'],
            'page' => $page,
            'per_page' => $perPage
        ]);
    }
    
    // sending a new msg
    elseif ($method === 'POST' && $pathParts[0] === 'send') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields using Validator class pattern
        $validator = new Validator($data ?? []);
        $validator
            ->required('receiver_id', 'Receiver ID is required')
            ->numeric('receiver_id', 'Receiver ID must be a number')
            ->required('message', 'Message is required')
            ->minLength('message', 1, 'Message cannot be empty')
            ->maxLength('message', 5000, 'Message cannot exceed 5000 characters');
        
        if ($validator->fails()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }
        
        $receiverId = (int)$data['receiver_id'];
        
        if ($receiverId === $currentUserId) {
            Response::error('Cannot send message to yourself', 400);
        }
        
        // checking if the receiver exists
        $checkUser = $db->prepare("SELECT id FROM users WHERE id = :id AND is_active = 1");
        $checkUser->execute(['id' => $receiverId]);
        if (!$checkUser->fetch()) {
            Response::error('Receiver not found or inactive', 404);
        }
        
        $messageData = [
            'sender_id' => $currentUserId,
            'receiver_id' => $receiverId,
            'message' => $data['message'],
            'service_id' => $data['service_id'] ?? null,
            'demand_id' => $data['demand_id'] ?? null,
            'attachments' => $data['attachments'] ?? null
        ];
        
        $messageId = $message->send($messageData);
        
        if ($messageId) {
            $newMessage = $message->getById($messageId);
            Response::success([
                'message' => 'Message sent successfully',
                'data' => $newMessage
            ], 201);
        } else {
            Response::error('Failed to send message', 500);
        }
    }
    
    // marking unread msgs as unread 
    elseif ($method === 'PUT' && $pathParts[0] === 'read' && isset($pathParts[1])) {
        $senderId = (int)$pathParts[1];
        
        $result = $message->markAsRead($currentUserId, $senderId);
        
        if ($result) {
            Response::success(['message' => 'Messages marked as read']);
        } else {
            Response::error('Failed to mark messages as read', 500);
        }
    }
    
    // counting unread msgs
    elseif ($method === 'GET' && $pathParts[0] === 'unread') {
        $count = $message->getUnreadCount($currentUserId);
        Response::success(['unread_count' => $count]);
    }
    
    // deletign a msg
    elseif ($method === 'DELETE' && isset($pathParts[0]) && is_numeric($pathParts[0])) {
        $messageId = (int)$pathParts[0];
        
        $result = $message->delete($messageId, $currentUserId);
        
        if ($result) {
            Response::success(['message' => 'Message deleted successfully']);
        } else {
            Response::error('Failed to delete message or not authorized', 400);
        }
    }
    
    // geting single msg
    elseif ($method === 'GET' && isset($pathParts[0]) && is_numeric($pathParts[0])) {
        $messageId = (int)$pathParts[0];
        
        $msg = $message->getById($messageId);
        
        if (!$msg) {
            Response::error('Message not found', 404);
        }
        
        // Checking wether the user is a sender or a receiver
        if ($msg['sender_id'] != $currentUserId && $msg['receiver_id'] != $currentUserId) {
            Response::error('Not authorized to view this message', 403);
        }
        
        Response::success($msg);
    }
    
    else {
        Response::error('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    error_log("Messages API Error: " . $e->getMessage());
    Response::error('Server error: ' . $e->getMessage(), 500);
}
