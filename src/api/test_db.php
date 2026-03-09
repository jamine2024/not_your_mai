<?php
// 数据库连接测试

require_once 'config.php';

header('Content-Type: application/json');

try {
    $db = getDB();
    
    // 测试查询
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => '数据库连接成功',
        'test_result' => $result,
        'config' => [
            'host' => $GLOBALS['db_config']['host'],
            'port' => $GLOBALS['db_config']['port'],
            'database' => $GLOBALS['db_config']['database']
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => '数据库连接失败: ' . $e->getMessage(),
        'config' => [
            'host' => getenv('DB_HOST') ?: 'localhost',
            'port' => getenv('DB_PORT') ?: 3306
        ]
    ]);
}
