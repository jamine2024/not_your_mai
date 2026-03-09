<?php
// 才不是你的小麦 - 数据库配置

// 完全抑制所有错误和警告输出，防止破坏 JSON
error_reporting(0);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// 优化上传配置 - 支持大文件和多文件上传
ini_set('upload_max_filesize', '100M');
ini_set('post_max_size', '500M');
ini_set('max_execution_time', '600');
ini_set('max_input_time', '600');
ini_set('memory_limit', '1G');

// 设置 CORS 头
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 设置错误处理函数
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("Error [$errno]: $errstr in $errfile on line $errline");
    return true;
});

set_exception_handler(function($e) {
    error_log("Exception: " . $e->getMessage());
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器内部错误']);
    exit;
});

// 数据库配置
// Docker 环境配置
$db_config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'wheat_album',
    'username' => 'root',
    'password' => 'root',
    'charset' => 'utf8mb4'
];

// 上传配置 - 使用相对路径
$upload_config = [
    'max_size' => 50 * 1024 * 1024, // 50MB
    'allowed_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'upload_path' => __DIR__ . '/../uploads/',
    'original_path' => __DIR__ . '/../uploads/original/',
    'thumb_path' => __DIR__ . '/../uploads/thumbs/',
    'thumb_width' => 400,
    'thumb_height' => 400,
];

// 网站配置
$site_config = [
    'name' => '才不是你的小麦',
    'slogan' => 'AI女友相册',
    'version' => '1.0.0',
];

// 创建数据库连接
function getDB() {
    global $db_config;
    
    try {
        // 使用 127.0.0.1 强制使用 TCP 连接而不是 socket
        $host = $db_config['host'] === 'localhost' ? '127.0.0.1' : $db_config['host'];
        $dsn = "mysql:host={$host};port={$db_config['port']};dbname={$db_config['database']};charset={$db_config['charset']}";
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password']);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        error_log('数据库连接失败: ' . $e->getMessage());
        error_log('DSN: mysql:host=' . $db_config['host'] . ';port=' . $db_config['port']);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => '数据库连接失败: ' . $e->getMessage()]);
        exit;
    }
}

// JSON响应
function jsonResponse($data) {
    // 清理输出缓冲区，防止任何额外输出破坏JSON
    if (ob_get_length()) {
        ob_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

// 错误响应
function errorResponse($message, $code = 400) {
    http_response_code($code);
    jsonResponse(['success' => false, 'message' => $message]);
}

// 成功响应
function successResponse($data = []) {
    jsonResponse(array_merge(['success' => true], $data));
}
