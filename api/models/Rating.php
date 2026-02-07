<?php
/**
 * Rating Model
 * Handles service ratings and reviews
 */

class Rating {
    private $conn;
    private $table = 'ratings';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Create a new rating
     * @param array $data
     * @return int|false
     */
    public function create($data) {
        $query = "INSERT INTO {$this->table} 
                  (user_id, service_id, transaction_id, rating, title, review, pros, cons, 
                   images, is_verified_purchase, status, created_at, updated_at)
                  VALUES (:user_id, :service_id, :transaction_id, :rating, :title, :review, :pros, :cons,
                          :images, :is_verified_purchase, :status, NOW(), NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'user_id' => $data['user_id'],
            'service_id' => $data['service_id'],
            'transaction_id' => $data['transaction_id'] ?? null,
            'rating' => $data['rating'],
            'title' => isset($data['title']) ? trim($data['title']) : null,
            'review' => isset($data['review']) ? trim($data['review']) : null,
            'pros' => isset($data['pros']) ? trim($data['pros']) : null,
            'cons' => isset($data['cons']) ? trim($data['cons']) : null,
            'images' => isset($data['images']) ? (is_array($data['images']) ? json_encode($data['images']) : $data['images']) : null,
            'is_verified_purchase' => $data['is_verified_purchase'] ?? 0,
            'status' => $data['status'] ?? 'active'
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Get rating by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT r.*, 
                         u.username as reviewer_username, u.full_name as reviewer_name, u.profile_image as reviewer_avatar,
                         s.title as service_title, s.user_id as provider_id,
                         provider.username as provider_username, provider.full_name as provider_name
                  FROM {$this->table} r
                  JOIN users u ON r.user_id = u.id
                  JOIN services s ON r.service_id = s.id
                  JOIN users provider ON s.user_id = provider.id
                  WHERE r.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get ratings for a service
     * @param int $serviceId
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getByService($serviceId, $page = 1, $perPage = 10, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["r.service_id = :service_id", "r.status = 'active'"];
        $params = ['service_id' => $serviceId];
        
        if (!empty($filters['rating'])) {
            $where[] = "r.rating = :rating";
            $params['rating'] = $filters['rating'];
        }
        
        if (!empty($filters['has_review'])) {
            $where[] = "r.review IS NOT NULL AND r.review != ''";
        }
        
        if (!empty($filters['verified_only'])) {
            $where[] = "r.is_verified_purchase = 1";
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Sorting
        $orderBy = "r.created_at DESC";
        if (!empty($filters['sort'])) {
            switch ($filters['sort']) {
                case 'highest':
                    $orderBy = "r.rating DESC, r.created_at DESC";
                    break;
                case 'lowest':
                    $orderBy = "r.rating ASC, r.created_at DESC";
                    break;
                case 'helpful':
                    $orderBy = "r.helpful_count DESC, r.created_at DESC";
                    break;
                case 'oldest':
                    $orderBy = "r.created_at ASC";
                    break;
            }
        }
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} r WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get ratings
        $query = "SELECT r.*, 
                         u.username as reviewer_username, u.full_name as reviewer_name, u.profile_image as reviewer_avatar
                  FROM {$this->table} r
                  JOIN users u ON r.user_id = u.id
                  WHERE {$whereClause}
                  ORDER BY {$orderBy}
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        // Get rating distribution
        $distributionQuery = "SELECT rating, COUNT(*) as count 
                              FROM {$this->table} 
                              WHERE service_id = :service_id AND status = 'active'
                              GROUP BY rating";
        $distStmt = $this->conn->prepare($distributionQuery);
        $distStmt->execute(['service_id' => $serviceId]);
        $distribution = $distStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Fill in missing ratings with 0
        for ($i = 1; $i <= 5; $i++) {
            if (!isset($distribution[$i])) {
                $distribution[$i] = 0;
            }
        }
        ksort($distribution);
        
        return [
            'ratings' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total,
            'distribution' => $distribution
        ];
    }
    
    /**
     * Get ratings by user
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByUser($userId, $page = 1, $perPage = 10) {
        $offset = ($page - 1) * $perPage;
        
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} WHERE user_id = :user_id AND status = 'active'";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute(['user_id' => $userId]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $query = "SELECT r.*, s.title as service_title, s.images as service_images
                  FROM {$this->table} r
                  JOIN services s ON r.service_id = s.id
                  WHERE r.user_id = :user_id AND r.status = 'active'
                  ORDER BY r.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'ratings' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Get ratings received by a provider (for all their services)
     * @param int $providerId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getByProvider($providerId, $page = 1, $perPage = 10) {
        $offset = ($page - 1) * $perPage;
        
        $countQuery = "SELECT COUNT(*) as total 
                       FROM {$this->table} r
                       JOIN services s ON r.service_id = s.id
                       WHERE s.user_id = :provider_id AND r.status = 'active'";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute(['provider_id' => $providerId]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $query = "SELECT r.*, 
                         s.title as service_title,
                         u.username as reviewer_username, u.full_name as reviewer_name, u.profile_image as reviewer_avatar
                  FROM {$this->table} r
                  JOIN services s ON r.service_id = s.id
                  JOIN users u ON r.user_id = u.id
                  WHERE s.user_id = :provider_id AND r.status = 'active'
                  ORDER BY r.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':provider_id', $providerId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'ratings' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Update a rating
     * @param int $id
     * @param int $userId
     * @param array $data
     * @return bool
     */
    public function update($id, $userId, $data) {
        $allowedFields = ['rating', 'title', 'review', 'pros', 'cons', 'images'];
        $updates = [];
        $params = ['id' => $id, 'user_id' => $userId];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "{$field} = :{$field}";
                if ($field === 'images' && is_array($data[$field])) {
                    $params[$field] = json_encode($data[$field]);
                } else {
                    $params[$field] = is_string($data[$field]) ? trim($data[$field]) : $data[$field];
                }
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $updates[] = "updated_at = NOW()";
        
        $query = "UPDATE {$this->table} SET " . implode(', ', $updates) . " WHERE id = :id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute($params);
    }
    
    /**
     * Add provider response to a rating
     * @param int $id
     * @param int $providerId
     * @param string $response
     * @return bool
     */
    public function addProviderResponse($id, $providerId, $response) {
        // Verify provider owns the service
        $query = "SELECT r.id FROM {$this->table} r
                  JOIN services s ON r.service_id = s.id
                  WHERE r.id = :rating_id AND s.user_id = :provider_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['rating_id' => $id, 'provider_id' => $providerId]);
        
        if (!$stmt->fetch()) {
            return false;
        }
        
        $query = "UPDATE {$this->table} 
                  SET provider_response = :response, provider_response_at = NOW(), updated_at = NOW() 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id, 'response' => trim($response)]);
    }
    
    /**
     * Delete a rating (by user or admin)
     * @param int $id
     * @param int|null $userId If null, admin delete
     * @return bool
     */
    public function delete($id, $userId = null) {
        if ($userId) {
            // User can only delete their own rating
            $query = "UPDATE {$this->table} SET status = 'deleted', updated_at = NOW() WHERE id = :id AND user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            return $stmt->execute(['id' => $id, 'user_id' => $userId]);
        }
        
        // Admin delete
        $query = "UPDATE {$this->table} SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
    
    /**
     * Check if user has already rated a service
     * @param int $userId
     * @param int $serviceId
     * @return bool
     */
    public function hasUserRated($userId, $serviceId) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} 
                  WHERE user_id = :user_id AND service_id = :service_id AND status != 'deleted'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId, 'service_id' => $serviceId]);
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0;
    }
    
    /**
     * Check if user has transaction with service (for verified purchase)
     * @param int $userId
     * @param int $serviceId
     * @return int|false Transaction ID if exists
     */
    public function hasVerifiedPurchase($userId, $serviceId) {
        $query = "SELECT id FROM transactions 
                  WHERE user_id = :user_id AND service_id = :service_id 
                  AND status = 'completed' AND type = 'purchase'
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId, 'service_id' => $serviceId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['id'] : false;
    }
    
    /**
     * Vote rating as helpful
     * @param int $ratingId
     * @param int $userId
     * @param bool $isHelpful
     * @return bool
     */
    public function voteHelpful($ratingId, $userId, $isHelpful = true) {
        // Check if user already voted
        $checkQuery = "SELECT id FROM rating_helpful_votes WHERE rating_id = :rating_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($checkQuery);
        $stmt->execute(['rating_id' => $ratingId, 'user_id' => $userId]);
        
        if ($stmt->fetch()) {
            // Update existing vote
            $query = "UPDATE rating_helpful_votes SET is_helpful = :is_helpful WHERE rating_id = :rating_id AND user_id = :user_id";
        } else {
            // Insert new vote
            $query = "INSERT INTO rating_helpful_votes (rating_id, user_id, is_helpful, created_at) VALUES (:rating_id, :user_id, :is_helpful, NOW())";
        }
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([
            'rating_id' => $ratingId,
            'user_id' => $userId,
            'is_helpful' => $isHelpful ? 1 : 0
        ]);
    }
    
    /**
     * Get service rating summary
     * @param int $serviceId
     * @return array
     */
    public function getServiceSummary($serviceId) {
        $query = "SELECT 
                    COUNT(*) as total_ratings,
                    COALESCE(AVG(rating), 0) as average_rating,
                    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star,
                    SUM(CASE WHEN review IS NOT NULL AND review != '' THEN 1 ELSE 0 END) as with_reviews
                  FROM {$this->table}
                  WHERE service_id = :service_id AND status = 'active'";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['service_id' => $serviceId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all ratings (Admin)
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
        
        if (!empty($filters['rating'])) {
            $where[] = "r.rating = :rating";
            $params['rating'] = $filters['rating'];
        }
        
        if (!empty($filters['service_id'])) {
            $where[] = "r.service_id = :service_id";
            $params['service_id'] = $filters['service_id'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "r.user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "(r.title LIKE :search OR r.review LIKE :search)";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} r WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $query = "SELECT r.*, 
                         u.username as reviewer_username, u.full_name as reviewer_name,
                         s.title as service_title
                  FROM {$this->table} r
                  JOIN users u ON r.user_id = u.id
                  JOIN services s ON r.service_id = s.id
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
            'ratings' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
    
    /**
     * Update rating status (Admin)
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
     * Toggle featured status (Admin)
     * @param int $id
     * @return bool
     */
    public function toggleFeatured($id) {
        $query = "UPDATE {$this->table} SET is_featured = NOT is_featured, updated_at = NOW() WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id]);
    }
}
