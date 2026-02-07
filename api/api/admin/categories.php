<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../models/Category.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../utils/JWT.php';

$database = new Database();
$db = $database->getConnection();
$category = new Category($db);

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    if ($method === 'GET') {
        if ($endpoint === 'stats') {
            $total = $category->getCount();
             
             $totalServices = 0;
             $totalDemands = 0;
             
             try {
                 $stmtS = $db->query("SELECT COUNT(*) as count FROM services WHERE category_id IN (SELECT id FROM categories)");
                 $totalServices = (int)$stmtS->fetch(PDO::FETCH_ASSOC)['count'];
                 
                 $stmtD = $db->query("SELECT COUNT(*) as count FROM demands WHERE category_id IN (SELECT id FROM categories)");
                 $totalDemands = (int)$stmtD->fetch(PDO::FETCH_ASSOC)['count'];
             } catch (Exception $e) {
                 // tables might not exist
             }
             
             Response::success([
                 'total_categories' => $total,
                 'user_added' => 0,
                 'total_demands' => $totalDemands,
                 'total_services' => $totalServices
             ]);
             
        } else {
             $filters = [];
             if (isset($_GET['search']) && !empty($_GET['search'])) {
                 $filters['search'] = $_GET['search'];
             }
             $result = $category->getAll(1, 100, $filters);
             Response::success($result);
        }
    } elseif ($method === 'POST') {
        if ($endpoint === 'create') {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Accept both 'name' and 'title' for flexibility
            $name = $data['name'] ?? $data['title'] ?? '';
            
            if (empty($name)) {
                Response::error('Category name is required', 400);
            }
            
            // Check for duplicate name
            if ($category->nameExists($name)) {
                Response::error('A category with this name already exists', 400);
            }
            
            $newId = $category->create([
                'name' => $name,
                'description' => $data['description'] ?? '',
                'icon' => $data['icon'] ?? null
            ]);
            
            if ($newId) {
                $newCategory = $category->getById($newId);
                Response::success($newCategory, 'Category created successfully');
            } else {
                Response::error('Failed to create category', 500);
            }
        }
    } elseif ($method === 'DELETE') {
        $categoryId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$categoryId) {
            Response::error('Category ID is required', 400);
        }
        
        $existingCategory = $category->getById($categoryId);
        if (!$existingCategory) {
            Response::error('Category not found', 404);
        }
        
        if ($category->delete($categoryId)) {
            Response::success(null, 'Category deleted successfully');
        } else {
            Response::error('Failed to delete category', 500);
        }
    } elseif ($method === 'PUT') {
        $categoryId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$categoryId) {
            Response::error('Category ID is required', 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $existingCategory = $category->getById($categoryId);
        if (!$existingCategory) {
            Response::error('Category not found', 404);
        }
        
        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['icon'])) $updateData['icon'] = $data['icon'];
        if (isset($data['is_active'])) $updateData['is_active'] = $data['is_active'];
        
        if ($category->update($categoryId, $updateData)) {
            $updated = $category->getById($categoryId);
            Response::success($updated, 'Category updated successfully');
        } else {
            Response::error('Failed to update category', 500);
        }
    } else {
        Response::error('Method not allowed', 405);
    }
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
