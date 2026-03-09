-- 才不是你的小麦 - AI女友相册 数据库初始化脚本

USE wheat_album;

-- 图片表
CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    thumb_path VARCHAR(500),
    file_size INT,
    width INT,
    height INT,
    taken_at DATETIME,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255),
    description TEXT,
    tags JSON,
    likes INT DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT FALSE,
    ai_tags JSON,
    mood VARCHAR(50),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_taken_at (taken_at),
    INDEX idx_is_favorite (is_favorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 相册表
CREATE TABLE IF NOT EXISTS albums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cover_photo_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 相册图片关联表
CREATE TABLE IF NOT EXISTS album_photos (
    album_id INT,
    photo_id INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (album_id, photo_id),
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 每日语录表
CREATE TABLE IF NOT EXISTS daily_quotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE UNIQUE,
    quote TEXT,
    mood VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户互动记录
CREATE TABLE IF NOT EXISTS interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    photo_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认每日语录
INSERT INTO daily_quotes (date, quote, mood) VALUES
(CURDATE(), '欢迎回来~ 今天想看点什么呢？', 'happy'),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '每一天都是新的开始，让我们一起记录美好吧！', 'excited'),
(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '你的笑容是我最喜欢的风景~', 'loving'),
(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '今天也要元气满满哦！', 'energetic'),
(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '想和你一起看遍这世间所有美好', 'romantic'),
(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '有你在的每一天都很特别', 'grateful'),
(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '让我们一起创造更多回忆吧', 'hopeful');

-- 创建默认相册
INSERT INTO albums (name, description) VALUES 
('默认相册', '自动收集的所有照片'),
('收藏精选', '最喜欢的照片'),
('私密相册', '只属于我们的秘密');
