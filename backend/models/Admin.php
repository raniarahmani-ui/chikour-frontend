<?php
/**
 * Admin Model
 * Handles all admin-related database operations with MySQL/PDO
 */

class Admin {
    private $conn;
    private $table = 'admins';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Authenticate admin by email and password
     * @param string $email
     * @param string $password
     * @return array|false
     */
    public function authenticate($identifier, $password) {
        $query = "SELECT id, username, email, password, full_name, role, is_active, last_login 
                  FROM {$this->table} 
                  WHERE (email = :id1 OR username = :id2) AND is_active = 1
                  LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $identifierLower = strtolower(trim($identifier));
        $stmt->execute(['id1' => $identifierLower, 'id2' => $identifierLower]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($admin && password_verify($password, $admin['password'])) {
            // Update last login
            $this->updateLastLogin($admin['id']);
            
            // Remove password from result
            unset($admin['password']);
            return $admin;
        }
        
        return false;
    }
    
    /**
     * Update last login timestamp
     * @param int $id
     * @return bool
     */
    public function updateLastLogin($id) {
        $query = "UPDATE {$this->table} SET last_login = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Get admin by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at 
                  FROM {$this->table} 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get admin by email
     * @param string $email
     * @return array|false
     */
    public function getByEmail($email) {
        $query = "SELECT id, username, email, full_name, role, is_active, last_login, created_at 
                  FROM {$this->table} 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['email' => strtolower(trim($email))]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all admins with pagination
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getAll($page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['role'])) {
            $where[] = "role = :role";
            $params['role'] = $filters['role'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(username LIKE :search OR email LIKE :search OR full_name LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get admins
        $query = "SELECT id, username, email, full_name, role, is_active, last_login, created_at 
                  FROM {$this->table} 
                  WHERE {$whereClause}
                  ORDER BY created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'admins' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Create new admin
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} (username, email, password, full_name, role, is_active, created_at, updated_at)
                  VALUES (:username, :email, :password, :full_name, :role, :is_active, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'username' => trim($data['username']),
            'email' => strtolower(trim($data['email'])),
            'password' => password_hash($data['password'], PASSWORD_DEFAULT),
            'full_name' => trim($data['full_name']),
            'role' => $data['role'] ?? 'admin',
            'is_active' => $data['is_active'] ?? 1
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update admin
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['username', 'email', 'full_name', 'avatar', 'role', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $field === 'email' ? strtolower(trim($data[$field])) : trim($data[$field]);
            }
        }
        
        // Handle password separately
        if (!empty($data['password'])) {
            $fields[] = "password = :password";
            $params['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
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
     * Delete admin (soft delete)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $query = "UPDATE {$this->table} SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Hard delete admin
     * @param int $id
     * @return bool
     */
    public function hardDelete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Check if email exists
     * @param string $email
     * @param int|null $excludeId
     * @return bool
     */
    public function emailExists($email, $excludeId = null) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE email = :email AND status != 'deleted'";
        $params = ['email' => strtolower(trim($email))];
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Check if username exists
     * @param string $username
     * @param int|null $excludeId
     * @return bool
     */
    public function usernameExists($username, $excludeId = null) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE username = :username AND status != 'deleted'";
        $params = ['username' => trim($username)];
        
        if ($excludeId) {
            $query .= " AND id != :exclude_id";
            $params['exclude_id'] = $excludeId;
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Log admin activity
     * @param int $adminId
     * @param string $action
     * @param string $entityType
     * @param int|null $entityId
     * @param array|null $details
     * @return bool
     */
    public function logActivity($adminId, $action, $entityType, $entityId = null, $details = null) {
        $query = "INSERT INTO admin_activity_logs (admin_id, action, entity_type, entity_id, details, ip_address, created_at)
                  VALUES (:admin_id, :action, :entity_type, :entity_id, :details, :ip_address, NOW())";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            'admin_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'details' => $details ? json_encode($details) : null,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    }
    
    /**
     * Get activity logs
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getActivityLogs($page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['admin_id'])) {
            $where[] = "l.admin_id = :admin_id";
            $params['admin_id'] = $filters['admin_id'];
        }
        
        if (!empty($filters['action'])) {
            $where[] = "l.action = :action";
            $params['action'] = $filters['action'];
        }
        
        if (!empty($filters['entity_type'])) {
            $where[] = "l.entity_type = :entity_type";
            $params['entity_type'] = $filters['entity_type'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total
        $countQuery = "SELECT COUNT(*) as total FROM admin_activity_logs l WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get logs
        $query = "SELECT l.*, a.username as admin_username, a.full_name as admin_name
                  FROM admin_activity_logs l
                  LEFT JOIN {$this->table} a ON l.admin_id = a.id
                  WHERE {$whereClause}
                  ORDER BY l.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'logs' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
}
