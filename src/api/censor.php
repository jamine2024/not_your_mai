<?php
// 才不是你的小麦 - 百度内容审核设置API

// 开启输出缓冲，防止任何意外输出破坏JSON
ob_start();

// 启动session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once 'config.php';
require_once '2fa.php';

// 清除任何可能的输出缓冲
ob_clean();

// 验证登录状态
function checkLogin() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        errorResponse('未登录', 401);
    }
}

// 配置文件路径
$configFile = __DIR__ . '/baidu_censor_config.json';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get':
        checkLogin();
        getCensorConfig();
        break;
    case 'save':
        checkLogin();
        saveCensorConfig();
        break;
    default:
        errorResponse('未知操作');
}

/**
 * 获取审核配置
 */
function getCensorConfig() {
    global $configFile;

    // 默认配置
    $defaultConfig = [
        'enabled' => false,
        'api_key' => '',
        'secret_key' => ''
    ];

    // 读取配置文件
    if (file_exists($configFile)) {
        $content = file_get_contents($configFile);
        $config = json_decode($content, true);
        if ($config) {
            $defaultConfig = array_merge($defaultConfig, $config);
        }
    }

    // 出于安全考虑，不返回完整的secret_key
    if (!empty($defaultConfig['secret_key'])) {
        $defaultConfig['secret_key'] = maskString($defaultConfig['secret_key']);
    }

    successResponse(['config' => $defaultConfig]);
}

/**
 * 保存审核配置
 */
function saveCensorConfig() {
    global $configFile;

    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        errorResponse('无效的请求数据');
    }

    // 读取现有配置
    $existingConfig = [];
    if (file_exists($configFile)) {
        $content = file_get_contents($configFile);
        $existingConfig = json_decode($content, true) ?: [];
    }

    // 构建新配置
    $config = [
        'enabled' => !empty($data['enabled']) ? true : false,
        'api_key' => trim($data['api_key'] ?? ''),
    ];

    // 如果提供了新的secret_key，则更新；否则保留原有的
    $newSecretKey = trim($data['secret_key'] ?? '');
    if (!empty($newSecretKey) && !isMasked($newSecretKey)) {
        $config['secret_key'] = $newSecretKey;
    } elseif (isset($existingConfig['secret_key'])) {
        $config['secret_key'] = $existingConfig['secret_key'];
    }

    // 验证配置
    if ($config['enabled'] && (empty($config['api_key']) || empty($config['secret_key']))) {
        errorResponse('启用审核时必须填写API Key和Secret Key');
    }

    // 保存配置
    if (file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT)) === false) {
        errorResponse('保存配置失败');
    }

    successResponse(['message' => '配置已保存']);
}

/**
 * 隐藏字符串（显示前4位和后4位）
 */
function maskString($str) {
    if (strlen($str) <= 8) {
        return str_repeat('*', strlen($str));
    }
    return substr($str, 0, 4) . str_repeat('*', strlen($str) - 8) . substr($str, -4);
}

/**
 * 检查字符串是否已被隐藏
 */
function isMasked($str) {
    return strpos($str, '***') !== false || preg_match('/^\*+$/', $str);
}
