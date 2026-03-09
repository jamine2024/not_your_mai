<?php
// 才不是你的小麦 - 登录验证API

// 开启输出缓冲，防止任何意外输出破坏JSON
ob_start();

require_once 'config.php';

// 注意：2fa.php 已经包含 session_start()，这里不需要重复调用
require_once '2fa.php';

// 清除任何可能的输出缓冲
ob_clean();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'check':
        checkAuth();
        break;
    default:
        errorResponse('未知操作');
}

// 处理登录
function handleLogin() {
    $data = json_decode(file_get_contents('php://input'), true);
    $password = $data['password'] ?? '';
    $code = $data['code'] ?? '';
    
    // 验证密码
    $storedPassword = file_get_contents(__DIR__ . '/../data/admin_password.txt');
    $storedPassword = trim($storedPassword); // 去除空白字符和换行符
    if (empty($storedPassword)) {
        // 默认密码
        $storedPassword = 'wheat2024';
    }
    
    if ($password !== $storedPassword) {
        errorResponse('密码错误');
    }
    
    // 检查是否开启了两步验证
    $secret = getStoredSecret();
    if ($secret) {
        // 需要验证两步验证码
        if (empty($code)) {
            echo json_encode([
                'success' => false,
                'need_2fa' => true,
                'message' => '请输入两步验证码'
            ]);
            return;
        }
        
        if (!verifyTOTP($secret, $code)) {
            errorResponse('两步验证码错误');
        }
    }
    
    // 登录成功
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['login_time'] = time();
    
    successResponse([
        'message' => '登录成功',
        'token' => session_id()
    ]);
}

// 处理退出
function handleLogout() {
    session_destroy();
    successResponse(['message' => '已退出登录']);
}

// 检查登录状态
function checkAuth() {
    $loggedIn = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
    
    // 检查是否过期（24小时）
    if ($loggedIn && isset($_SESSION['login_time'])) {
        $hoursPassed = (time() - $_SESSION['login_time']) / 3600;
        if ($hoursPassed > 24) {
            session_destroy();
            $loggedIn = false;
        }
    }
    
    successResponse([
        'logged_in' => $loggedIn
    ]);
}
