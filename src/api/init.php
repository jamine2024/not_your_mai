<?php
// 才不是你的小麦 - 数据库初始化

require_once 'config.php';

header('Content-Type: application/json');

try {
    $db = getDB();
    
    // 创建照片表
    $db->exec("CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        thumb_path VARCHAR(500) NOT NULL,
        file_size INT DEFAULT 0,
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        taken_at DATETIME NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        likes INT DEFAULT 0,
        is_favorite TINYINT(1) DEFAULT 0,
        INDEX idx_taken_at (taken_at),
        INDEX idx_uploaded_at (uploaded_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    echo json_encode(['success' => true, 'message' => '数据库初始化成功']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '初始化失败: ' . $e->getMessage()]);
}
