<?php
/**
 * Message Model
 * Handles all message/chat-related database operations with MySQL/PDO
 */

class Message {
    private $conn;
    private $table = 'messages';
    
    public function __construct($db) {
        $this->conn = $db;
    }
    
    /**
     * Get conversation between two users
     * @param int $userId1
     * @param int $userId2
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function getConversation($userId1, $userId2, $page = 1, $perPage = 50) {
        $offset = ($page - 1) * $perPage;
        
        // Get total count
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} 
                       WHERE (sender_id = :user1_a AND receiver_id = :user2_a) 
                          OR (sender_id = :user2_b AND receiver_id = :user1_b)";
        
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute([
            'user1_a' => $userId1,
            'user2_a' => $userId2,
            'user2_b' => $userId2,
            'user1_b' => $userId1
        ]);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get messages
        $query = "SELECT m.id, m.sender_id, m.receiver_id, m.service_id, m.demand_id, m.content as message, m.is_read, m.read_at, m.created_at, 
                         s.username as sender_username, s.full_name as sender_name, s.profile_image as sender_avatar,
                         r.username as receiver_username, r.full_name as receiver_name, r.profile_image as receiver_avatar
                  FROM {$this->table} m
                  LEFT JOIN users s ON m.sender_id = s.id
                  LEFT JOIN users r ON m.receiver_id = r.id
                  WHERE (m.sender_id = :user1_a AND m.receiver_id = :user2_a) 
                     OR (m.sender_id = :user2_b AND m.receiver_id = :user1_b)
                  ORDER BY m.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':user1_a', $userId1, PDO::PARAM_INT);
        $stmt->bindValue(':user2_a', $userId2, PDO::PARAM_INT);
        $stmt->bindValue(':user2_b', $userId2, PDO::PARAM_INT);
        $stmt->bindValue(':user1_b', $userId1, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'messages' => array_reverse($messages), // Reverse to show oldest first
            'total' => (int)$total
        ];
    }
    
    /**
     * Get all conversations for a user
     * @param int $userId
     * @return array
     */
    public function getUserConversations($userId) {
        // Get unique conversation partners with last message
        $query = "SELECT 
                    CASE 
                        WHEN m.sender_id = :user_id THEN m.receiver_id 
                        ELSE m.sender_id 
                    END as partner_id,
                    u.username as partner_username,
                    u.full_name as partner_name,
                    u.profile_image as partner_avatar,
                    u.is_active as partner_status,
                    (SELECT content FROM {$this->table} 
                     WHERE (sender_id = :user_id_a AND receiver_id = u.id) 
                        OR (sender_id = u.id AND receiver_id = :user_id_b)
                     ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM {$this->table} 
                     WHERE (sender_id = :user_id_c AND receiver_id = u.id) 
                        OR (sender_id = u.id AND receiver_id = :user_id_d)
                     ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM {$this->table} 
                     WHERE sender_id = u.id AND receiver_id = :user_id_e AND is_read = 0) as unread_count
                  FROM {$this->table} m
                  JOIN users u ON u.id = CASE 
                      WHEN m.sender_id = :user_id_f THEN m.receiver_id 
                      ELSE m.sender_id 
                  END
                  WHERE m.sender_id = :user_id_g OR m.receiver_id = :user_id_h
                  GROUP BY partner_id, u.username, u.full_name, u.profile_image, u.is_active
                  ORDER BY last_message_time DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([
            'user_id' => $userId,
            'user_id_a' => $userId,
            'user_id_b' => $userId,
            'user_id_c' => $userId,
            'user_id_d' => $userId,
            'user_id_e' => $userId,
            'user_id_f' => $userId,
            'user_id_g' => $userId,
            'user_id_h' => $userId
        ]);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Send a message
     * @param array $data
     * @return int|false
     */
    public function send($data) {
        $query = "INSERT INTO {$this->table} 
                  (sender_id, receiver_id, service_id, demand_id, content, is_read, created_at)
                  VALUES (:sender_id, :receiver_id, :service_id, :demand_id, :message, 0, NOW())";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            'sender_id' => $data['sender_id'],
            'receiver_id' => $data['receiver_id'],
            'service_id' => $data['service_id'] ?? null,
            'demand_id' => $data['demand_id'] ?? null,
            'message' => trim($data['message'])
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    /**
     * Get message by ID
     * @param int $id
     * @return array|false
     */
    public function getById($id) {
        $query = "SELECT m.*, 
                         s.username as sender_username, s.full_name as sender_name, s.profile_image as sender_avatar,
                         r.username as receiver_username, r.full_name as receiver_name, r.profile_image as receiver_avatar
                  FROM {$this->table} m
                  LEFT JOIN users s ON m.sender_id = s.id
                  LEFT JOIN users r ON m.receiver_id = r.id
                  WHERE m.id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Mark messages as read
     * @param int $userId - The user reading the messages
     * @param int $senderId - The sender whose messages to mark as read
     * @return bool
     */
    public function markAsRead($userId, $senderId) {
        $query = "UPDATE {$this->table} SET is_read = 1, read_at = NOW() 
                  WHERE receiver_id = :user_id AND sender_id = :sender_id AND is_read = 0";
        
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['user_id' => $userId, 'sender_id' => $senderId]);
    }
    
    /**
     * Get unread message count for user
     * @param int $userId
     * @return int
     */
    public function getUnreadCount($userId) {
        $query = "SELECT COUNT(*) as count FROM {$this->table} 
                  WHERE receiver_id = :user_id AND is_read = 0";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    /**
     * Delete a message (soft delete by sender)
     * @param int $id
     * @param int $userId
     * @return bool
     */
    public function delete($id, $userId) {
        // Only allow sender to delete their own message
        $query = "DELETE FROM {$this->table} WHERE id = :id AND sender_id = :user_id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute(['id' => $id, 'user_id' => $userId]);
    }
    
    /**
     * Get total message count (for admin)
     * @return int
     */
    public function getTotalCount() {
        $query = "SELECT COUNT(*) as count FROM {$this->table}";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
    
    /**
     * Get messages for admin with pagination
     * @param int $page
     * @param int $perPage
     * @param array $filters
     * @return array
     */
    public function getAllForAdmin($page = 1, $perPage = 20, $filters = []) {
        $offset = ($page - 1) * $perPage;
        $where = ["1=1"];
        $params = [];
        
        if (!empty($filters['user_id'])) {
            $where[] = "(sender_id = :user_id OR receiver_id = :user_id_2)";
            $params['user_id'] = $filters['user_id'];
            $params['user_id_2'] = $filters['user_id'];
        }
        
        if (!empty($filters['search'])) {
            $where[] = "content LIKE :search";
            $params['search'] = '%' . $filters['search'] . '%';
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Get total
        $countQuery = "SELECT COUNT(*) as total FROM {$this->table} WHERE {$whereClause}";
        $stmt = $this->conn->prepare($countQuery);
        $stmt->execute($params);
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get messages
        $query = "SELECT m.*, 
                         s.username as sender_username, s.full_name as sender_name,
                         r.username as receiver_username, r.full_name as receiver_name
                  FROM {$this->table} m
                  LEFT JOIN users s ON m.sender_id = s.id
                  LEFT JOIN users r ON m.receiver_id = r.id
                  WHERE {$whereClause}
                  ORDER BY m.created_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        $stmt->bindValue(':limit', (int)$perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return [
            'messages' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => (int)$total
        ];
    }
}
