<?php
/**
 * ReportType Model
 * Manages report type categories (spam, harassment, fraud, etc.)
 */

class ReportType {
    private $conn;
    private $table = 'report_types';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get all report types
     * @param bool $activeOnly
     * @param string|null $entityType
     * @return array
     */
    public function getAll($activeOnly = true, $entityType = null) {
        $where = [];
        $params = [];
        
        if ($activeOnly) {
            $where[] = "is_active = 1";
        }
        
        if ($entityType) {
            $where[] = "(entity_type = :entity_type OR entity_type = 'all')";
            $params['entity_type'] = $entityType;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $query = "SELECT * FROM {$this->table} {$whereClause} ORDER BY sort_order ASC, name ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get report type by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT * FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get report type by slug
     * @param string $slug
     * @return array|false
     */
    public function getBySlug($slug) {
        $query = "SELECT * FROM {$this->table} WHERE slug = :slug";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['slug' => $slug]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Create new report type (Admin)
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        // Generate slug if not provided
        $slug = $data['slug'] ?? $this->generateSlug($data['name']);
        
        $query = "INSERT INTO {$this->table} 
                  (name, slug, description, entity_type, is_active, sort_order, created_at, updated_at)
                  VALUES (:name, :slug, :description, :entity_type, :is_active, :sort_order, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'name' => trim($data['name']),
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'entity_type' => $data['entity_type'] ?? 'all',
            'is_active' => $data['is_active'] ?? 1,
            'sort_order' => $data['sort_order'] ?? 0
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update report type (Admin)
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $allowedFields = ['name', 'slug', 'description', 'entity_type', 'is_active', 'sort_order'];
        $updates = [];
        $params = ['id' => $id];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "{$field} = :{$field}";
                $params[$field] = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $updates[] = "updated_at = NOW()";
        
        $query = "UPDATE {$this->table} SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }
    
    /**
     * Delete report type (Admin)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        // Check if type is in use
        $checkQuery = "SELECT COUNT(*) as count FROM reports WHERE report_type_id = :id";
        $stmt = $this->conn->prepare($checkQuery);
        $stmt->execute(['id' => $id]);
        
        if ($stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0) {
            // Soft delete by deactivating
            return $this->update($id, ['is_active' => 0]);
        }
        
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Toggle active status
     * @param int $id
     * @return bool
     */
    public function toggleActive($id) {
        $query = "UPDATE {$this->table} SET is_active = NOT is_active, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Reorder report types
     * @param array $orderedIds Array of IDs in desired order
     * @return bool
     */
    public function reorder($orderedIds) {
        $this->conn->beginTransaction();
        
        try {
            $query = "UPDATE {$this->table} SET sort_order = :sort_order WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            
            foreach ($orderedIds as $index => $id) {
                $stmt->execute(['id' => $id, 'sort_order' => $index + 1]);
            }
            
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
    
    /**
     * Check if slug exists
     * @param string $slug
     * @param int|null $excludeId
     * @return bool
     */
    public function slugExists($slug, $excludeId = null) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE slug = :slug";
        $params = ['slug' => $slug];
        
        if ($excludeId) {
            $query .= " AND id != :id";
            $params['id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Generate unique slug from name
     * @param string $name
     * @return string
     */
    private function generateSlug($name) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));
        $originalSlug = $slug;
        $counter = 1;
        
        while ($this->slugExists($slug)) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }
    
    /**
     * Get report count by type
     * @return array
     */
    public function getReportCounts() {
        $query = "SELECT rt.*, 
                         COUNT(r.id) as total_reports,
                         SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_reports
                  FROM {$this->table} rt
                  LEFT JOIN reports r ON rt.id = r.report_type_id
                  GROUP BY rt.id
                  ORDER BY rt.sort_order ASC";
        
        $stmt = $this->conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
