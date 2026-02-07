<?php
/**
 * Transaction Model
 * Handles all transaction-related database operations with MySQL/PDO
 */

class Transaction {
    private $conn;
    private $table = 'transactions';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get all transactions with pagination and filters
     * Railway DB columns: id, service_id, demand_id, from_user_id, to_user_id, coins, type, status, notes, created_at, updated_at
     */
    public function getAll($page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['type'])) {
            $where[] = "t.type = :type";
            $params['type'] = $filters['type'];
        }
        
        if (!empty($filters['status'])) {
            $where[] = "t.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "(t.from_user_id = :user_id OR t.to_user_id = :user_id2)";
            $params['user_id'] = $filters['user_id'];
            $params['user_id2'] = $filters['user_id'];
        }
        
        if (!empty($filters['service_id'])) {
            $where[] = "t.service_id = :service_id";
            $params['service_id'] = $filters['service_id'];
        }
        
        if (!empty($filters['demand_id'])) {
            $where[] = "t.demand_id = :demand_id";
            $params['demand_id'] = $filters['demand_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $where[] = "t.created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = "t.created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        if (!empty($filters['min_amount'])) {
            $where[] = "t.coins >= :min_amount";
            $params['min_amount'] = $filters['min_amount'];
        }
        
        if (!empty($filters['max_amount'])) {
            $where[] = "t.coins <= :max_amount";
            $params['max_amount'] = $filters['max_amount'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} t WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get transactions with user info
        $query = "SELECT t.*, 
                         fu.username as from_username, fu.full_name as from_user_name, fu.profile_image as from_user_avatar,
                         tu.username as to_username, tu.full_name as to_user_name, tu.profile_image as to_user_avatar,
                         s.title as service_title,
                         d.title as demand_title
                  FROM {$this->table} t
                  LEFT JOIN users fu ON t.from_user_id = fu.id
                  LEFT JOIN users tu ON t.to_user_id = tu.id
                  LEFT JOIN services s ON t.service_id = s.id
                  LEFT JOIN demands d ON t.demand_id = d.id
                  WHERE {$whereClause}
                  ORDER BY t.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'transactions' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Get transaction by ID
     */
    public function getById($id) {
        $query = "SELECT t.*, 
                         fu.username as from_username, fu.full_name as from_user_name, fu.email as from_user_email, fu.profile_image as from_user_avatar,
                         tu.username as to_username, tu.full_name as to_user_name, tu.email as to_user_email, tu.profile_image as to_user_avatar,
                         s.title as service_title,
                         d.title as demand_title
                  FROM {$this->table} t
                  LEFT JOIN users fu ON t.from_user_id = fu.id
                  LEFT JOIN users tu ON t.to_user_id = tu.id
                  LEFT JOIN services s ON t.service_id = s.id
                  LEFT JOIN demands d ON t.demand_id = d.id
                  WHERE t.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get transactions by user ID (as sender or receiver)
     */
    public function getByUserId($userId, $page = 1, $perPage = 10) {
        return $this->getAll($page, $perPage, ['user_id' => $userId]);
    }
    
    /**
     * Create new transaction
     * Railway columns: from_user_id, to_user_id, coins, type, status, notes, service_id, demand_id
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (from_user_id, to_user_id, coins, type, status, notes, service_id, demand_id, created_at, updated_at)
                  VALUES (:from_user_id, :to_user_id, :coins, :type, :status, :notes, :service_id, :demand_id, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'from_user_id' => $data['from_user_id'],
            'to_user_id' => $data['to_user_id'],
            'coins' => $data['coins'] ?? $data['amount'] ?? 0,
            'type' => $data['type'],
            'status' => $data['status'] ?? 'pending',
            'notes' => isset($data['notes']) ? trim($data['notes']) : (isset($data['description']) ? trim($data['description']) : null),
            'service_id' => $data['service_id'] ?? null,
            'demand_id' => $data['demand_id'] ?? null
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Update transaction
     */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        
        $allowedFields = ['status', 'notes'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
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
     * Update transaction status
     */
    public function updateStatus($id, $status) {
        $query = "UPDATE {$this->table} SET status = :status, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id, 'status' => $status]);
    }
    
    /**
     * Get total transaction count
     */
    public function getCount($filters = []) {
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['type'])) {
            $where[] = "type = :type";
            $params['type'] = $filters['type'];
        }
        
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "(from_user_id = :user_id OR to_user_id = :user_id2)";
            $params['user_id'] = $filters['user_id'];
            $params['user_id2'] = $filters['user_id'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    /**
     * Get total transaction amount (coins)
     */
    public function getTotalAmount($filters = []) {
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['type'])) {
            $where[] = "type = :type";
            $params['type'] = $filters['type'];
        }
        
        if (!empty($filters['status'])) {
            $where[] = "status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "(from_user_id = :user_id OR to_user_id = :user_id2)";
            $params['user_id'] = $filters['user_id'];
            $params['user_id2'] = $filters['user_id'];
        }
        
        if (!empty($filters['date_from'])) {
            $where[] = "created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = "created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $query = "SELECT COALESCE(SUM(coins), 0) as total FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
    }
    
    /**
     * Get recent transactions
     */
    public function getRecent($limit = 10) {
        $query = "SELECT t.*, 
                         fu.username as from_username, fu.full_name as from_user_name, fu.profile_image as from_user_avatar,
                         tu.username as to_username, tu.full_name as to_user_name, tu.profile_image as to_user_avatar
                  FROM {$this->table} t
                  LEFT JOIN users fu ON t.from_user_id = fu.id
                  LEFT JOIN users tu ON t.to_user_id = tu.id
                  ORDER BY t.created_at DESC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get transaction statistics
     */
    public function getStatistics($filters = []) {
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['date_from'])) {
            $where[] = "created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = "created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        $query = "SELECT 
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(coins), 0) as total_amount,
                    COALESCE(AVG(coins), 0) as average_amount,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
                    COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_count,
                    COUNT(CASE WHEN type = 'purchase' THEN 1 END) as purchase_count,
                    COUNT(CASE WHEN type = 'service_payment' THEN 1 END) as service_payment_count,
                    COUNT(CASE WHEN type = 'demand_payment' THEN 1 END) as demand_payment_count,
                    COUNT(CASE WHEN type = 'bonus' THEN 1 END) as bonus_count,
                    COUNT(CASE WHEN type = 'refund' THEN 1 END) as refund_count
                  FROM {$this->table}
                  WHERE {$whereClause}";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get daily transaction summary
     */
    public function getDailySummary($days = 30) {
        $query = "SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count,
                    COALESCE(SUM(coins), 0) as total_coins
                  FROM {$this->table}
                  WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                  GROUP BY DATE(created_at)
                  ORDER BY date ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':days', (int)$days, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get user transaction summary
     */
    public function getUserSummary($userId) {
        $query = "SELECT 
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(CASE WHEN to_user_id = :uid1 AND type = 'purchase' THEN coins ELSE 0 END), 0) as total_received,
                    COALESCE(SUM(CASE WHEN from_user_id = :uid2 THEN coins ELSE 0 END), 0) as total_sent,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
                  FROM {$this->table}
                  WHERE from_user_id = :uid3 OR to_user_id = :uid4";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['uid1' => $userId, 'uid2' => $userId, 'uid3' => $userId, 'uid4' => $userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
