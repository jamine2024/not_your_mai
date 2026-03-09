<?php
// 才不是你的小麦 - 图片上传接口

// 开启输出缓冲
ob_start();

require_once 'config.php';

// 只允许POST请求
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('请求方法不允许', 405);
}

// 检查并创建上传目录
$originalDir = $upload_config['original_path'];
$thumbDir = $upload_config['thumb_path'];

if (!file_exists($originalDir)) {
    if (!mkdir($originalDir, 0755, true)) {
        errorResponse('创建上传目录失败: ' . $originalDir);
    }
}
if (!file_exists($thumbDir)) {
    if (!mkdir($thumbDir, 0755, true)) {
        errorResponse('创建缩略图目录失败: ' . $thumbDir);
    }
}

// 检查目录是否可写
if (!is_writable($originalDir)) {
    errorResponse('上传目录不可写: ' . $originalDir);
}
if (!is_writable($thumbDir)) {
    errorResponse('缩略图目录不可写: ' . $thumbDir);
}

// 处理上传
if (!isset($_FILES['files'])) {
    errorResponse('没有上传文件');
}

$files = $_FILES['files'];
$uploaded = [];
$errors = [];

// 处理多文件上传
if (is_array($files['name'])) {
    $fileCount = count($files['name']);
    for ($i = 0; $i < $fileCount; $i++) {
        $file = [
            'name' => $files['name'][$i],
            'type' => $files['type'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'error' => $files['error'][$i],
            'size' => $files['size'][$i]
        ];
        
        $result = processUpload($file);
        if ($result['success']) {
            $uploaded[] = $result['data'];
        } else {
            $errors[] = $result['message'];
        }
    }
} else {
    $result = processUpload($files);
    if ($result['success']) {
        $uploaded[] = $result['data'];
    } else {
        $errors[] = $result['message'];
    }
}

// 返回结果
if (count($uploaded) > 0) {
    successResponse([
        'uploaded' => $uploaded,
        'errors' => $errors,
        'count' => count($uploaded)
    ]);
} else {
    errorResponse('上传失败: ' . implode(', ', $errors));
}

// 处理单个文件上传
function processUpload($file) {
    global $upload_config;
    
    // 检查错误
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => '上传错误: ' . $file['error']];
    }
    
    // 检查文件类型
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $upload_config['allowed_types'])) {
        return ['success' => false, 'message' => '不支持的文件类型: ' . $mimeType];
    }
    
    // 检查文件大小
    if ($file['size'] > $upload_config['max_size']) {
        return ['success' => false, 'message' => '文件过大'];
    }
    
    // 生成文件名
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = date('Ymd_His') . '_' . uniqid() . '.' . strtolower($extension);
    $originalPath = $upload_config['original_path'] . $filename;
    $thumbFilename = 'thumb_' . $filename;
    $thumbPath = $upload_config['thumb_path'] . $thumbFilename;
    
    // 获取图片尺寸
    list($width, $height) = getimagesize($file['tmp_name']);
    
    // 移动原图
    if (!move_uploaded_file($file['tmp_name'], $originalPath)) {
        $error = error_get_last();
        return ['success' => false, 'message' => '保存文件失败: ' . $originalPath . ' - ' . ($error['message'] ?? '未知错误')];
    }
    
    // 生成缩略图
    createThumbnail($originalPath, $thumbPath, $upload_config['thumb_width'], $upload_config['thumb_height']);
    
    // 获取拍摄时间
    $takenAt = null;
    if (function_exists('exif_read_data')) {
        $exif = @exif_read_data($originalPath);
        if ($exif && isset($exif['DateTimeOriginal'])) {
            $takenAt = date('Y-m-d H:i:s', strtotime($exif['DateTimeOriginal']));
        }
    }
    
    // 保存到数据库
    try {
        $db = getDB();
        $stmt = $db->prepare("INSERT INTO photos (filename, original_name, file_path, thumb_path, file_size, width, height, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $filename,
            $file['name'],
            'uploads/original/' . $filename,
            'uploads/thumbs/' . $thumbFilename,
            $file['size'],
            $width,
            $height,
            $takenAt
        ]);
        
        $photoId = $db->lastInsertId();
        
        return [
            'success' => true,
            'data' => [
                'id' => $photoId,
                'filename' => $filename,
                'original_name' => $file['name'],
                'file_path' => 'uploads/original/' . $filename,
                'thumb_path' => 'uploads/thumbs/' . $thumbFilename,
                'width' => $width,
                'height' => $height,
                'taken_at' => $takenAt,
                'uploaded_at' => date('Y-m-d H:i:s')
            ]
        ];
    } catch (PDOException $e) {
        // 删除已上传的文件
        @unlink($originalPath);
        @unlink($thumbPath);
        return ['success' => false, 'message' => '数据库错误: ' . $e->getMessage()];
    }
}

// 创建缩略图
function createThumbnail($source, $dest, $maxWidth, $maxHeight) {
    list($width, $height, $type) = getimagesize($source);
    
    // 计算新尺寸
    $ratio = min($maxWidth / $width, $maxHeight / $height);
    $newWidth = (int)($width * $ratio);
    $newHeight = (int)($height * $ratio);
    
    // 创建画布
    $thumb = imagecreatetruecolor($newWidth, $newHeight);
    
    // 加载源图
    switch ($type) {
        case IMAGETYPE_JPEG:
            $source = imagecreatefromjpeg($source);
            break;
        case IMAGETYPE_PNG:
            $source = imagecreatefrompng($source);
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);
            break;
        case IMAGETYPE_GIF:
            $source = imagecreatefromgif($source);
            break;
        default:
            return false;
    }
    
    // 调整大小
    imagecopyresampled($thumb, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    
    // 保存
    switch ($type) {
        case IMAGETYPE_JPEG:
            imagejpeg($thumb, $dest, 85);
            break;
        case IMAGETYPE_PNG:
            imagepng($thumb, $dest, 8);
            break;
        case IMAGETYPE_GIF:
            imagegif($thumb, $dest);
            break;
    }
    
    imagedestroy($thumb);
    imagedestroy($source);
    
    return true;
}
