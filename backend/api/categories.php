<?php
// Admin management of categories + public endpoints

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../models/Category.php';

// Initialize database connection
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$category = new Category($db);

// Parse URI
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);
preg_match('/\/categories\/(\d+)/', $path, $matches);
$categoryId = $matches[1] ?? null;

// Check for action
preg_match('/\/categories\/(\d+)\/(\w+)/', $path, $actionMatches);
$action = $actionMatches[2] ?? null;

// Public endpoints (no auth required)
if (strpos($path, '/categories/public') !== false) {
    getPublicCategories($category);
    exit;
}

if (strpos($path, '/categories/tree') !== false && $method === 'GET') {
    // No subcategories in Railway DB, return flat list
    getPublicCategories($category);
    exit;
}

if (strpos($path, '/categories/simple') !== false && $method === 'GET') {
    getSimpleList($category);
    exit;
}

// For admin endpoints, require authentication
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
$auth = new AuthMiddleware($db);
$currentAdmin = $auth->authenticate();

switch ($method) {
    case 'GET':
        if ($categoryId && $action === 'subcategories') {
            getSubcategories($categoryId, $category);
        } elseif ($categoryId) {
            getCategory($categoryId, $category);
        } else {
            getCategories($category);
        }
        break;
    case 'POST':
        createCategory($category, $auth);
        break;
    case 'PUT':
    case 'PATCH':
        if (!$categoryId) {
            Response::error("Category ID is required");
        }
        updateCategory($categoryId, $category, $auth);
        break;
    case 'DELETE':
        if (!$categoryId) {
            Response::error("Category ID is required");
        }
        deleteCategory($categoryId, $category, $auth);
        break;
    default:
        Response::methodNotAllowed();
}

// Public function - returns active categories for users
function getPublicCategories($category) {
    $categories = $category->getActiveCategories();
    Response::success($categories);
}

function getCategories($category) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? min((int)$_GET['per_page'], MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
    
    $filters = [
        'search' => $_GET['search'] ?? null
    ];
    
    $result = $category->getAll($page, $perPage, array_filter($filters));
    
    Response::paginated($result['categories'], $page, $perPage, $result['total']);
}

function getCategory($id, $category) {
    $categoryData = $category->getById($id);
    
    if (!$categoryData) {
        Response::notFound("Category not found");
    }
    
    Response::success($categoryData);
}

function getSubcategories($id, $category) {
    // No subcategories in Railway DB - return empty
    Response::success([]);
}

function getSimpleList($category) {
    $categories = $category->getAllSimple();
    Response::success($categories);
}

function createCategory($category, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate input
    $validator = new Validator($data);
    $validator
        ->required('name', 'Name is required')
        ->minLength('name', 2, 'Name must be at least 2 characters')
        ->maxLength('name', 100, 'Name cannot exceed 100 characters');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if name exists
    if ($category->nameExists($data['name'])) {
        Response::error("Category name already exists", 409);
    }
    
    // Create category
    $categoryId = $category->create($data);
    
    if (!$categoryId) {
        Response::error("Failed to create category");
    }
    
    // Log activity
    $auth->logActivity('create', 'category', $categoryId, ['name' => $data['name']]);
    
    $newCategory = $category->getById($categoryId);
    Response::success($newCategory, "Category created successfully", 201);
}

function updateCategory($id, $category, $auth) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check if category exists
    $existingCategory = $category->getById($id);
    if (!$existingCategory) {
        Response::notFound("Category not found");
    }
    
    // Validate input
    $validator = new Validator($data);
    
    if (isset($data['name'])) {
        $validator->minLength('name', 2, 'Name must be at least 2 characters')
                  ->maxLength('name', 100, 'Name cannot exceed 100 characters');
        
        // Check name uniqueness
        if ($category->nameExists($data['name'], $id)) {
            Response::error("Category name already exists", 409);
        }
    }
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Update category
    if (!$category->update($id, $data)) {
        Response::error("Failed to update category");
    }
    
    // Log activity
    $auth->logActivity('update', 'category', $id, ['changes' => array_keys($data)]);
    
    $updatedCategory = $category->getById($id);
    Response::success($updatedCategory, "Category updated successfully");
}

function deleteCategory($id, $category, $auth) {
    $existingCategory = $category->getById($id);
    if (!$existingCategory) {
        Response::notFound("Category not found");
    }
    
    // Check if has services or demands
    if (($existingCategory['service_count'] ?? 0) > 0 || ($existingCategory['demand_count'] ?? 0) > 0) {
        Response::error("Cannot delete category with associated services or demands");
    }
    
    if (!$category->delete($id)) {
        Response::error("Failed to delete category");
    }
    
    $auth->logActivity('delete', 'category', $id, ['name' => $existingCategory['name']]);
    
    Response::success(null, "Category deleted successfully");
}

// Reorder not supported - no sort_order column in Railway DB
