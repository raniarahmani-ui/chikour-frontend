<?php
/**
 * Report Model
 * Handles all report-related database operations
 * Users can report other users, services, or demands
 */

class Report {
    private $conn;
    private $table = 'reports';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Create a new report
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (reporter_id, report_type_id, reported_user_id, reported_service_id, reported_demand_id, 
                   reason, created_at, updated_at)
                  VALUES (:reporter_id, :report_type_id, :reported_user_id, :reported_service_id, :reported_demand_id,
                          :reason, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'reporter_id' => $data['reporter_id'],
            'report_type_id' => $data['report_type_id'],
            'reported_user_id' => $data['reported_user_id'] ?? null,
            'reported_service_id' => $data['reported_service_id'] ?? null,
            'reported_demand_id' => $data['reported_demand_id'] ?? null,
            'reason' => trim($data['reason'])
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Get report by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT r.*, 
                         rt.name as report_type_name,
                         reporter.username as reporter_username, reporter.full_name as reporter_name, reporter.profile_image as reporter_avatar,
                         reported_user.username as reported_user_username, reported_user.full_name as reported_user_name,
                         s.title as reported_service_title, s.user_id as service_owner_id,
                         d.title as reported_demand_title, d.user_id as demand_owner_id,
                         a.username as resolved_by_username
                  FROM {$this->table} r
                  LEFT JOIN report_types rt ON r.report_type_id = rt.id
                  LEFT JOIN users reporter ON r.reporter_id = reporter.id
                  LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
                  LEFT JOIN services s ON r.reported_service_id = s.id
                  LEFT JOIN demands d ON r.reported_demand_id = d.id
                  LEFT JOIN admins a ON r.resolved_by = a.id
                  WHERE r.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all reports with pagination and filters (Admin)
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getAll($page = 1, $perPage = 20, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['status'])) {
            $where[] = "r.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (!empty($filters['report_type_id'])) {
            $where[] = "r.report_type_id = :report_type_id";
            $params['report_type_id'] = $filters['report_type_id'];
        }
        
        if (!empty($filters['reporter_id'])) {
            $where[] = "r.reporter_id = :reporter_id";
            $params['reporter_id'] = $filters['reporter_id'];
        }
        
        if (!empty($filters['entity_type'])) {
            switch ($filters['entity_type']) {
                case 'user':
                    $where[] = "r.reported_user_id IS NOT NULL";
                    break;
                case 'service':
                    $where[] = "r.reported_service_id IS NOT NULL";
                    break;
                case 'demand':
                    $where[] = "r.reported_demand_id IS NOT NULL";
                    break;
            }
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(r.reason LIKE :search OR reporter.username LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        if (!empty($filters['date_from'])) {
            $where[] = "r.created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (!empty($filters['date_to'])) {
            $where[] = "r.created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} r 
                       LEFT JOIN users reporter ON r.reporter_id = reporter.id
                       WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get reports
        $query = "SELECT r.*, 
                         rt.name as report_type_name,
                         reporter.username as reporter_username, reporter.full_name as reporter_name,
                         reported_user.username as reported_user_username,
                         s.title as reported_service_title,
                         d.title as reported_demand_title
                  FROM {$this->table} r
                  LEFT JOIN report_types rt ON r.report_type_id = rt.id
                  LEFT JOIN users reporter ON r.reporter_id = reporter.id
                  LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
                  LEFT JOIN services s ON r.reported_service_id = s.id
                  LEFT JOIN demands d ON r.reported_demand_id = d.id
                  WHERE {$whereClause}
                  ORDER BY r.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'reports' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Get reports by user (reports made by this user)
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByReporter($userId, $page = 1, $perPage = 20) {
        return $this->getAll($page, $perPage, ['reporter_id' => $userId]);
    }
    
    /**
     * Get reports against a specific user
     * @param int $userId
     * @return array
     */
    public function getAgainstUser($userId) {
        $query = "SELECT r.*, rt.name as report_type_name
                  FROM {$this->table} r
                  LEFT JOIN report_types rt ON r.report_type_id = rt.id
                  WHERE r.reported_user_id = :user_id
                  ORDER BY r.created_at DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update report status (Admin)
     * @param int $id
     * @param string $status
     * @param int $adminId
     * @param string|null $adminNote
     * @return bool
     */
    public function updateStatus($id, $status, $adminId, $adminNotes = null) {
        $updates = ['status' => $status, 'updated_at' => date('Y-m-d H:i:s')];
        
        if ($adminNotes) {
            $updates['admin_notes'] = $adminNotes;
        }
        
        if (in_array($status, ['resolved', 'dismissed'])) {
            $updates['resolved_by'] = $adminId;
            $updates['resolved_at'] = date('Y-m-d H:i:s');
        }
        
        $setParts = [];
        foreach ($updates as $key => $value) {
            $setParts[] = "{$key} = :{$key}";
        }
        
        $query = "UPDATE {$this->table} SET " . implode(', ', $setParts) . " WHERE id = :id";
        $updates['id'] = $id;
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($updates);
    }
    
    /**
     * Resolve report with action (Admin)
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function resolve($id, $data) {
        $query = "UPDATE {$this->table} 
                  SET status = :status,
                      admin_notes = :admin_notes,
                      resolved_by = :resolved_by,
                      resolved_at = NOW(),
                      updated_at = NOW()
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            'id' => $id,
            'status' => 'resolved',
            'admin_notes' => $data['admin_notes'] ?? $data['admin_note'] ?? null,
            'resolved_by' => $data['admin_id']
        ]);
    }
    
    /**
     * Add internal note (Admin)
     * @param int $id
     * @param string $note
     * @param int $adminId
     * @return bool
     */
    public function addAdminNotes($id, $notes) {
        $query = "UPDATE {$this->table} SET admin_notes = :notes, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            'id' => $id,
            'notes' => $notes
        ]);
    }
    
    /**
     * Check if user has already reported an entity
     * @param int $reporterId
     * @param string $entityType
     * @param int $entityId
     * @return bool
     */
    public function hasAlreadyReported($reporterId, $entityType, $entityId) {
        $column = "reported_{$entityType}_id";
        
        $query = "SELECT COUNT(*) as count FROM {$this->table} 
                  WHERE reporter_id = :reporter_id 
                  AND {$column} = :entity_id 
                  AND status NOT IN ('resolved', 'dismissed')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'reporter_id' => $reporterId,
            'entity_id' => $entityId
        ]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Get report statistics (Admin Dashboard)
     * @return array
     */
    public function getStatistics() {
        $stats = [];
        
        // Total reports by status
        $query = "SELECT status, COUNT(*) as count FROM {$this->table} GROUP BY status";
        $stmt = $this->conn->query($query);
        $stats['by_status'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Total reports by type
        $query = "SELECT rt.name, COUNT(*) as count 
                  FROM {$this->table} r
                  JOIN report_types rt ON r.report_type_id = rt.id
                  GROUP BY r.report_type_id, rt.name";
        $stmt = $this->conn->query($query);
        $stats['by_type'] = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Recent reports (last 7 days)
        $query = "SELECT DATE(created_at) as date, COUNT(*) as count 
                  FROM {$this->table} 
                  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  GROUP BY DATE(created_at)
                  ORDER BY date";
        $stmt = $this->conn->query($query);
        $stats['recent_daily'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Pending count
        $query = "SELECT COUNT(*) as count FROM {$this->table} WHERE status = 'pending'";
        $stmt = $this->conn->query($query);
        $stats['pending_count'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        return $stats;
    }
    
    /**
     * Delete report (Admin only - soft delete or reassign)
     * @param int $id
     * @return bool
     */
    public function delete($id) {
        $query = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
}
