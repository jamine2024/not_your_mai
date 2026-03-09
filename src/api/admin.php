<?php
// 才不是你的小麦 - 后台管理API

// 开启输出缓冲，防止任何意外输出破坏JSON
ob_start();

require_once 'config.php';

// 注意：2fa.php 已经包含 session_start()，这里不需要重复调用
require_once '2fa.php';

// 清除任何可能的输出缓冲
ob_clean();

// 验证登录状态
function checkLogin() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        errorResponse('未登录', 401);
    }
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'change_password':
        checkLogin();
        changePassword();
        break;
    case 'get_stats':
        checkLogin();
        getStats();
        break;
    default:
        errorResponse('未知操作');
}

// 修改密码
function changePassword() {
    $data = json_decode(file_get_contents('php://input'), true);
    $currentPassword = $data['current_password'] ?? '';
    $newPassword = $data['new_password'] ?? '';
    
    // 读取当前密码
    $passwordFile = __DIR__ . '/../data/admin_password.txt';
    $storedPassword = file_exists($passwordFile) ? trim(file_get_contents($passwordFile)) : 'wheat2024';
    
    // 验证当前密码
    if ($currentPassword !== $storedPassword) {
        errorResponse('当前密码错误');
    }
    
    // 验证新密码长度
    if (strlen($newPassword) < 6) {
        errorResponse('新密码至少需要6位');
    }
    
    // 保存新密码
    if (file_put_contents($passwordFile, $newPassword) === false) {
        errorResponse('保存密码失败');
    }
    
    successResponse(['message' => '密码修改成功']);
}

// 获取统计数据
function getStats() {
    try {
        $db = getDB();
        
        $stats = [
            'total_photos' => 0,
            'total_likes' => 0,
            'total_favorites' => 0,
            'total_days' => 0
        ];
        
        // 总照片数
        $stmt = $db->query("SELECT COUNT(*) as count FROM photos");
        $stats['total_photos'] = (int)$stmt->fetch()['count'];
        
        // 总点赞数
        $stmt = $db->query("SELECT SUM(likes) as count FROM photos");
        $stats['total_likes'] = (int)($stmt->fetch()['count'] ?? 0);
        
        // 收藏数
        $stmt = $db->query("SELECT COUNT(*) as count FROM photos WHERE is_favorite = 1");
        $stats['total_favorites'] = (int)$stmt->fetch()['count'];
        
        // 不同天数
        $stmt = $db->query("SELECT COUNT(DISTINCT DATE(taken_at)) as count FROM photos WHERE taken_at IS NOT NULL");
        $stats['total_days'] = (int)$stmt->fetch()['count'];
        
        successResponse(['stats' => $stats]);
    } catch (PDOException $e) {
        errorResponse('获取统计失败: ' . $e->getMessage());
    }
}
