<?php
// 才不是你的小麦 - 相册API

// 开启输出缓冲
ob_start();

require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listPhotos();
        break;
    case 'like':
        toggleLike();
        break;
    case 'favorite':
        toggleFavorite();
        break;
    case 'delete':
        deletePhoto();
        break;
    case 'stats':
        getStats();
        break;
    case 'deduplicate':
        deduplicatePhotos();
        break;
    default:
        errorResponse('未知操作');
}

// 获取照片列表
function listPhotos() {
    try {
        $db = getDB();
        
        // 获取分页参数
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $perPage = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 30;
        
        // 计算偏移量
        $offset = ($page - 1) * $perPage;
        
        // 获取总数
        $countStmt = $db->query("SELECT COUNT(*) as count FROM photos");
        $total = $countStmt->fetch()['count'];
        
        // 获取分页数据
        $stmt = $db->prepare("SELECT * FROM photos ORDER BY taken_at DESC, uploaded_at DESC LIMIT ? OFFSET ?");
        $stmt->bindParam(1, $perPage, PDO::PARAM_INT);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $photos = $stmt->fetchAll();
        
        // 计算总页数
        $totalPages = ceil($total / $perPage);
        
        successResponse([
            'photos' => $photos,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $totalPages
            ]
        ]);
    } catch (PDOException $e) {
        errorResponse('获取照片失败: ' . $e->getMessage());
    }
}

// 切换点赞
function toggleLike() {
    $data = json_decode(file_get_contents('php://input'), true);
    $photoId = $data['photo_id'] ?? 0;
    
    if (!$photoId) {
        errorResponse('缺少照片ID');
    }
    
    try {
        $db = getDB();
        
        // 检查是否已点赞（这里简化处理，实际应该关联用户）
        $stmt = $db->prepare("SELECT likes FROM photos WHERE id = ?");
        $stmt->execute([$photoId]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            errorResponse('照片不存在');
        }
        
        // 这里简化处理，实际应该检查用户是否已点赞
        $newLikes = $photo['likes'] + 1;
        
        $stmt = $db->prepare("UPDATE photos SET likes = ? WHERE id = ?");
        $stmt->execute([$newLikes, $photoId]);
        
        successResponse([
            'likes' => $newLikes,
            'is_liked' => true
        ]);
    } catch (PDOException $e) {
        errorResponse('操作失败: ' . $e->getMessage());
    }
}

// 切换收藏
function toggleFavorite() {
    $data = json_decode(file_get_contents('php://input'), true);
    $photoId = $data['photo_id'] ?? 0;
    
    if (!$photoId) {
        errorResponse('缺少照片ID');
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("SELECT is_favorite FROM photos WHERE id = ?");
        $stmt->execute([$photoId]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            errorResponse('照片不存在');
        }
        
        $newStatus = !$photo['is_favorite'];
        
        $stmt = $db->prepare("UPDATE photos SET is_favorite = ? WHERE id = ?");
        $stmt->execute([$newStatus ? 1 : 0, $photoId]);
        
        successResponse(['is_favorite' => $newStatus]);
    } catch (PDOException $e) {
        errorResponse('操作失败: ' . $e->getMessage());
    }
}

// 删除照片
function deletePhoto() {
    $data = json_decode(file_get_contents('php://input'), true);
    $photoId = $data['photo_id'] ?? 0;
    
    if (!$photoId) {
        errorResponse('缺少照片ID');
    }
    
    try {
        $db = getDB();
        
        // 获取文件路径
        $stmt = $db->prepare("SELECT file_path, thumb_path FROM photos WHERE id = ?");
        $stmt->execute([$photoId]);
        $photo = $stmt->fetch();
        
        if (!$photo) {
            errorResponse('照片不存在');
        }
        
        // 删除文件 - 使用相对路径
        $basePath = __DIR__ . '/../';
        @unlink($basePath . $photo['file_path']);
        @unlink($basePath . $photo['thumb_path']);
        
        // 删除数据库记录
        $stmt = $db->prepare("DELETE FROM photos WHERE id = ?");
        $stmt->execute([$photoId]);
        
        successResponse(['message' => '删除成功']);
    } catch (PDOException $e) {
        errorResponse('删除失败: ' . $e->getMessage());
    }
}

// 获取统计信息
function getStats() {
    try {
        $db = getDB();
        
        $stats = [];
        
        // 总照片数
        $stmt = $db->query("SELECT COUNT(*) as count FROM photos");
        $stats['total_photos'] = $stmt->fetch()['count'];
        
        // 总点赞数
        $stmt = $db->query("SELECT SUM(likes) as count FROM photos");
        $stats['total_likes'] = $stmt->fetch()['count'] ?? 0;
        
        // 收藏数
        $stmt = $db->query("SELECT COUNT(*) as count FROM photos WHERE is_favorite = 1");
        $stats['total_favorites'] = $stmt->fetch()['count'];
        
        // 不同天数 - 优先使用taken_at，否则使用uploaded_at
        $stmt = $db->query("SELECT COUNT(DISTINCT DATE(COALESCE(taken_at, uploaded_at))) as count FROM photos");
        $stats['total_days'] = $stmt->fetch()['count'] ?? 0;      
        successResponse(['stats' => $stats]);
    } catch (PDOException $e) {
        errorResponse('获取统计失败: ' . $e->getMessage());
    }
}

// 一键去重照片
function deduplicatePhotos() {
    try {
        $db = getDB();
        
        // 开始事务
        $db->beginTransaction();
        
        // 找出重复的照片组
        $stmt = $db->query("SELECT 
            original_name, file_size, width, height, 
            MIN(uploaded_at) as earliest_upload, 
            GROUP_CONCAT(id ORDER BY uploaded_at) as photo_ids
        FROM photos 
        GROUP BY original_name, file_size, width, height 
        HAVING COUNT(*) > 1");
        
        $duplicateGroups = $stmt->fetchAll();
        $deletedCount = 0;
        $deletedFiles = [];
        
        foreach ($duplicateGroups as $group) {
            $photoIds = explode(',', $group['photo_ids']);
            $earliestId = $photoIds[0]; // 第一个是上传时间最早的
            
            // 删除其他重复的照片
            for ($i = 1; $i < count($photoIds); $i++) {
                $photoId = $photoIds[$i];
                
                // 获取文件路径
                $stmt = $db->prepare("SELECT file_path, thumb_path FROM photos WHERE id = ?");
                $stmt->execute([$photoId]);
                $photo = $stmt->fetch();
                
                if ($photo) {
                    // 删除文件
                    $basePath = __DIR__ . '/../';
                    if (file_exists($basePath . $photo['file_path'])) {
                        unlink($basePath . $photo['file_path']);
                        $deletedFiles[] = $photo['file_path'];
                    }
                    if (file_exists($basePath . $photo['thumb_path'])) {
                        unlink($basePath . $photo['thumb_path']);
                        $deletedFiles[] = $photo['thumb_path'];
                    }
                    
                    // 删除数据库记录
                    $stmt = $db->prepare("DELETE FROM photos WHERE id = ?");
                    $stmt->execute([$photoId]);
                    
                    $deletedCount++;
                }
            }
        }
        
        // 提交事务
        $db->commit();
        
        successResponse([
            'message' => '去重完成',
            'deleted_count' => $deletedCount,
            'deleted_files' => $deletedFiles
        ]);
    } catch (PDOException $e) {
        // 回滚事务
        $db->rollBack();
        errorResponse('去重失败: ' . $e->getMessage());
    }
}
