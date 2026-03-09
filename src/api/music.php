<?php
// 才不是你的小麦 - 音乐管理API

// 开启输出缓冲
ob_start();

require_once 'config.php';

// 音乐存储路径
$MUSIC_DIR = __DIR__ . '/../uploads/music/';
$MUSIC_JSON = __DIR__ . '/../data/music.json';

// 确保目录存在
if (!is_dir($MUSIC_DIR)) {
    mkdir($MUSIC_DIR, 0755, true);
}
if (!is_dir(__DIR__ . '/../data')) {
    mkdir(__DIR__ . '/../data', 0755, true);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        listMusic();
        break;
    case 'upload':
        uploadMusic();
        break;
    case 'delete':
        deleteMusic();
        break;
    default:
        errorResponse('未知操作');
}

// 获取音乐列表
function listMusic() {
    global $MUSIC_JSON;
    
    $music = [];
    if (file_exists($MUSIC_JSON)) {
        $content = file_get_contents($MUSIC_JSON);
        $music = json_decode($content, true) ?: [];
    }
    
    successResponse(['music' => $music]);
}

// 上传音乐
function uploadMusic() {
    global $MUSIC_DIR, $MUSIC_JSON;
    
    if (!isset($_FILES['file'])) {
        errorResponse('没有上传文件');
    }
    
    $file = $_FILES['file'];
    
    // 检查错误
    if ($file['error'] !== UPLOAD_ERR_OK) {
        errorResponse('上传错误: ' . $file['error']);
    }
    
    // 检查文件类型
    $allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a'];
    if (!in_array($file['type'], $allowedTypes)) {
        errorResponse('不支持的文件类型: ' . $file['type']);
    }
    
    // 检查文件大小 (20MB)
    if ($file['size'] > 20 * 1024 * 1024) {
        errorResponse('文件过大，最大支持20MB');
    }
    
    // 生成文件名
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $filepath = $MUSIC_DIR . $filename;
    
    // 移动文件
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        errorResponse('保存文件失败');
    }
    
    // 读取现有列表
    $music = [];
    if (file_exists($MUSIC_JSON)) {
        $content = file_get_contents($MUSIC_JSON);
        $music = json_decode($content, true) ?: [];
    }
    
    // 添加新音乐
    $musicItem = [
        'id' => uniqid(),
        'name' => $file['name'],
        'filename' => $filename,
        'size' => formatFileSize($file['size']),
        'url' => 'uploads/music/' . $filename,
        'uploaded_at' => date('Y-m-d H:i:s')
    ];
    $music[] = $musicItem;
    
    // 保存列表
    file_put_contents($MUSIC_JSON, json_encode($music, JSON_PRETTY_PRINT));
    
    successResponse([
        'message' => '上传成功',
        'music' => $musicItem
    ]);
}

// 删除音乐
function deleteMusic() {
    global $MUSIC_DIR, $MUSIC_JSON;
    
    $id = $_POST['id'] ?? '';
    if (empty($id)) {
        errorResponse('缺少音乐ID');
    }
    
    // 读取列表
    if (!file_exists($MUSIC_JSON)) {
        errorResponse('音乐列表不存在');
    }
    
    $content = file_get_contents($MUSIC_JSON);
    $music = json_decode($content, true) ?: [];
    
    // 查找并删除
    $found = false;
    foreach ($music as $key => $item) {
        if ($item['id'] === $id) {
            // 删除文件
            $filepath = $MUSIC_DIR . $item['filename'];
            if (file_exists($filepath)) {
                unlink($filepath);
            }
            unset($music[$key]);
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        errorResponse('音乐不存在');
    }
    
    // 重新索引并保存
    $music = array_values($music);
    file_put_contents($MUSIC_JSON, json_encode($music, JSON_PRETTY_PRINT));
    
    successResponse(['message' => '删除成功']);
}

// 格式化文件大小
function formatFileSize($size) {
    if ($size < 1024) {
        return $size . ' B';
    } elseif ($size < 1024 * 1024) {
        return round($size / 1024, 2) . ' KB';
    } else {
        return round($size / (1024 * 1024), 2) . ' MB';
    }
}
