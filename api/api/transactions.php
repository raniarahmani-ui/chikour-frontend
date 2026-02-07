<?php
// Admin management of transactions

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../models/Transaction.php';

$database = new Database();
$db = $database->getConnection();

$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

$method = $_SERVER['REQUEST_METHOD'];
$transaction = new Transaction($db);

$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/transactions\/(\d+)/', $path, $matches);
$transactionId = $matches[1] ?? null;

preg_match('/\/transactions\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;

if (strpos($path, '/transactions/stats') !== false) {
    getStats($transaction);
}

if (strpos($path, '/transactions/daily-summary') !== false) {
    getDailySummary($transaction);
}

if (strpos($path, '/transactions/recent') !== false) {
    getRecent($transaction);
}

switch ($method) {
    case 'GET':
        if ($transactionId) {
            getTransaction($transactionId, $transaction);
        } else {
            getTransactions($transaction);
        }
        break;
    case 'POST':
        createTransaction($transaction, $auth);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$transactionId) {
            Response::error("Transaction ID is required");
        }
        if ($action === 'status') {
            updateTransactionStatus($transactionId, $transaction, $auth);
        } else {
            updateTransaction($transactionId, $transaction, $auth);
        }
        break;
    default:
        Response::methodNotAllowed();
}

function getTransactions($transaction) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'type' => $_GET['type'] ?? null,
        'status' => $_GET['status'] ?? null,
        'user_id' => $_GET['user_id'] ?? null,
        'service_id' => $_GET['service_id'] ?? null,
        'demand_id' => $_GET['demand_id'] ?? null,
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null,
        'min_amount' => $_GET['min_amount'] ?? null,
        'max_amount' => $_GET['max_amount'] ?? null
    ];
    
    $result = $transaction->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['transactions'], $page, $perPage, $result['total']);
}

function getTransaction($id, $transaction) {
    $transactionData = $transaction->getById($id);
    
    if (!$transactionData) {
        Response::notFound("Transaction not found");
    }
    
    Response::success($transactionData);
}

function getRecent($transaction) {
    $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 50) : 10;
    $transactions = $transaction->getRecent($limit);
    Response::success($transactions);
}

function getStats($transaction) {
    $filters = [
        'date_from' => $_GET['date_from'] ?? null,
        'date_to' => $_GET['date_to'] ?? null
    ];
    
    $stats = $transaction->getStatistics(array_filter($filters));
    Response::success($stats);
}

function getDailySummary($transaction) {
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 30;
    $summary = $transaction->getDailySummary($days);
    Response::success($summary);
}

function createTransaction($transaction, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);

    $validator = new Validator($data);
    $validator
        ->required('type', 'Type is required')
        ->in('type', ['service_payment', 'demand_payment', 'bonus', 'refund', 'purchase'], 'Invalid transaction type');
    
    // Support both old and new field names
    if (empty($data['from_user_id']) && !empty($data['user_id'])) {
        $data['from_user_id'] = $data['user_id'];
        $data['to_user_id'] = $data['user_id'];
    }
    if (empty($data['coins']) && !empty($data['amount'])) {
        $data['coins'] = $data['amount'];
    }

    if (empty($data['from_user_id'])) {
        Response::validationError(['from_user_id' => 'From user ID is required']);
    }
    if (empty($data['coins'])) {
        Response::validationError(['coins' => 'Coins amount is required']);
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Create a transaction
    $transactionId = $transaction->create($data);
    
    if (!$transactionId) {
        Response::error("Failed to create transaction");
    }

    $auth->logActivity('create', 'transaction', $transactionId, [
        'type' => $data['type'],
        'coins' => $data['coins']
    ]);
    
    $newTransaction = $transaction->getById($transactionId);
    Response::success($newTransaction, "Transaction created successfully", 201);
}

function updateTransaction($id, $transaction, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $existingTransaction = $transaction->getById($id);
    if (!$existingTransaction) {
        Response::notFound("Transaction not found");
    }

    if (!$transaction->update($id, $data)) {
        Response::error("Failed to update transaction");
    }

    $auth->logActivity('update', 'transaction', $id, ['changes' => array_keys($data)]);
    
    $updatedTransaction = $transaction->getById($id);
    Response::success($updatedTransaction, "Transaction updated successfully");
}

function updateTransactionStatus($id, $transaction, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $validator = new Validator($data);
    $validator->required('status', 'Status is required')
              ->in('status', ['pending', 'completed', 'cancelled', 'disputed'], 'Invalid status');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    $existingTransaction = $transaction->getById($id);
    if (!$existingTransaction) {
        Response::notFound("Transaction not found");
    }
    
    if (!$transaction->updateStatus($id, $data['status'])) {
        Response::error("Failed to update transaction status");
    }
    
    $auth->logActivity('status_change', 'transaction', $id, [
        'old_status' => $existingTransaction['status'],
        'new_status' => $data['status']
    ]);
    
    Response::success(['status' => $data['status']], "Transaction status updated successfully");
}
