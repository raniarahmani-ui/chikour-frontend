<?php
/**
 * Service Model
 * Handles all service-related database operations with MySQL/PDO
 */

class Service {
    private $conn;
    private $table = 'services';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get all services with pagination and filters
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getAll($page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["s.status != 'deleted'"];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "s.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['category_id'])) {
            $where[] = "s.category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "s.user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(s.title LIKE :search OR s.description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['min_price'])) {
            $where[] = "s.price >= :min_price";
            $params['min_price'] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $where[] = "s.price <= :max_price";
            $params['max_price'] = $filters['max_price'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} s WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get services with user and category info
        $query = "SELECT s.*, 
                         u.username, u.full_name as provider_name, u.profile_image as provider_avatar,
                         c.name as category_name
                  FROM {$this->table} s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN categories c ON s.category_id = c.id
                  WHERE {$whereClause}
                  ORDER BY s.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'services' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Get service by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT s.*, 
                         u.username, u.full_name as provider_name, u.email as provider_email, 
                         u.profile_image as provider_avatar, u.is_active as provider_status,
                         c.name as category_name
                  FROM {$this->table} s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN categories c ON s.category_id = c.id
                  WHERE s.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get services by user ID
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByUserId($userId, $page = 1, $perPage = 10) {
        return $this->getAll($page, $perPage, ['user_id' => $userId]);
    }
    
    /**
     * Get services by category
     * @param int $categoryId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByCategory($categoryId, $page = 1, $perPage = 10) {
        return $this->getAll($page, $perPage, ['category_id' => $categoryId]);
    }
    
    /**
     * Create new service
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (user_id, category_id, title, description, price, duration, images, tags, status, created_at, updated_at)
                  VALUES (:user_id, :category_id, :title, :description, :price, :duration, :images, :tags, :status, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'user_id' => $data['user_id'],
            'category_id' => $data['category_id'],
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'price' => $data['price'],
            'duration' => $data['duration'] ?? null,
            'images' => isset($data['images']) ? (is_array($data['images']) ? json_encode($data['images']) : $data['images']) : null,
            'tags' => isset($data['tags']) ? (is_array($data['tags']) ? json_encode($data['tags']) : $data['tags']) : null,
            'status' => $data['status'] ?? 'pending'
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update service
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['category_id', 'title', 'description', 'price', 'duration', 'images', 'tags', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                if (in_array($field, ['images', 'tags']) && is_array($data[$field])) {
                    $params[$field] = json_encode($data[$field]);
                } elseif (is_string($data[$field])) {
                    $params[$field] = trim($data[$field]);
                } else {
                    $params[$field] = $data[$field];
                }
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $fields[] = "updated_at = NOW()";
        
        $query = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }
    
    /**
     * Update service status
     * @param int $id
     * @param string $status
     * @return bool
     */
    public function updateStatus($id, $status) {
        $query = "UPDATE {$this->table} SET status = :status, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id, 'status' => $status]);
    }
    
    /**
     * Delete service (soft delete)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $query = "UPDATE {$this->table} SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Hard delete service
     * @param int $id
     * @return bool
     */
    public function hardDelete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Get total service count
     * @param array $filters
     * @return int
     */
    public function getCount($filters = []) {
        $where = ["status != 'deleted'"];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['category_id'])) {
            $where[] = "category_id = :category_id";
            $params['category_id'] = $filters['category_id'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    /**
     * Get recent services
     * @param int $limit
     * @return array
     */
    public function getRecent($limit = 10) {
        $query = "SELECT s.*, 
                         u.username, u.full_name as provider_name, u.profile_image as provider_avatar,
                         c.name as category_name
                  FROM {$this->table} s
                  LEFT JOIN users u ON s.user_id = u.id
                  LEFT JOIN categories c ON s.category_id = c.id
                  WHERE s.status = 'active'
                  ORDER BY s.created_at DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Search services
     * @param string $keyword
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function search($keyword, $page = 1, $perPage = 10) {
        return $this->getAll($page, $perPage, ['search' => $keyword, 'status' => 'active']);
    }
    
    /**
     * Increment view count
     * @param int $id
     * @return bool
     */
    public function incrementViews($id) {
        $query = "UPDATE {$this->table} SET views = views + 1 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Check if service belongs to user
     * @param int $serviceId
     * @param int $userId
     * @return bool
     */
    public function belongsToUser($serviceId, $userId) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE id = :service_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['service_id' => $serviceId, 'user_id' => $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
}
