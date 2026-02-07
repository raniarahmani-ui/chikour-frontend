<?php
/**
 * Category Model
 * Handles all category-related database operations with MySQL/PDO
 * 
 * Railway DB schema for categories:
 * id (int), name (varchar(100)), description (text), icon (varchar(50)),
 * is_active (tinyint(1)), created_at (timestamp), updated_at (timestamp)
 */

class Category {
    private $conn;
    private $table = 'categories';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get all categories with pagination and filters
     */
    public function getAll($page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (isset($filters['is_active'])) {
            $where[] = "is_active = :is_active";
            $params['is_active'] = $filters['is_active'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(name LIKE :search OR description LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get categories with service/demand counts
        $query = "SELECT c.*,
                         (SELECT COUNT(*) FROM services WHERE category_id = c.id) as service_count,
                         (SELECT COUNT(*) FROM demands WHERE category_id = c.id) as demand_count
                  FROM {$this->table} c
                  WHERE {$whereClause}
                  ORDER BY c.name ASC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'categories' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Get all categories without pagination (for dropdowns)
     */
    public function getAllSimple($filters = []) {
        $query = "SELECT id, name, icon FROM {$this->table} 
                  WHERE is_active = 1 ORDER BY name ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all active categories for public use
     */
    public function getActiveCategories() {
        $query = "SELECT id, name, icon, description 
                  FROM {$this->table} 
                  WHERE is_active = 1
                  ORDER BY name ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get category by ID
     */
    public function getById($id) {
        $query = "SELECT c.*,
                         (SELECT COUNT(*) FROM services WHERE category_id = c.id) as service_count,
                         (SELECT COUNT(*) FROM demands WHERE category_id = c.id) as demand_count
                  FROM {$this->table} c
                  WHERE c.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Create new category
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (name, description, icon, is_active, created_at, updated_at)
                  VALUES (:name, :description, :icon, :is_active, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'name' => trim($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'icon' => $data['icon'] ?? null,
            'is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update category
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['name', 'description', 'icon', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                if (is_string($data[$field])) {
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
     * Delete category
     */
    public function delete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Check if category name exists
     */
    public function nameExists($name, $excludeId = null) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE name = :name";
        $params = ['name' => trim($name)];
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Get total category count
     */
    public function getCount($filters = []) {
        $where = ["1=1"];
        $params = [];
        
        if (isset($filters['is_active'])) {
            $where[] = "is_active = :is_active";
            $params['is_active'] = $filters['is_active'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
}
