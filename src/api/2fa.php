<?php
// 才不是你的小麦 - 两步验证 (TOTP/Google Authenticator)

session_start();

// 数据存储路径
$DATA_DIR = __DIR__ . '/../data';
$SECRET_FILE = $DATA_DIR . '/2fa_secret.txt';

// 确保数据目录存在
if (!is_dir($DATA_DIR)) {
    mkdir($DATA_DIR, 0755, true);
}

// 生成随机密钥
function generateSecret($length = 32) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = '';
    for ($i = 0; $i < $length; $i++) {
        $secret .= $chars[random_int(0, 31)];
    }
    return $secret;
}

// Base32 解码
function base32Decode($input) {
    $map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $input = strtoupper($input);
    $output = '';
    $buffer = 0;
    $bufferSize = 0;
    
    for ($i = 0; $i < strlen($input); $i++) {
        $char = $input[$i];
        $val = strpos($map, $char);
        if ($val === false) continue;
        
        $buffer = ($buffer << 5) | $val;
        $bufferSize += 5;
        
        if ($bufferSize >= 8) {
            $bufferSize -= 8;
            $output .= chr(($buffer >> $bufferSize) & 0xFF);
        }
    }
    
    return $output;
}

// 生成 TOTP 验证码
function generateTOTP($secret, $timeStep = 30, $time = null) {
    if ($time === null) {
        $time = time();
    }
    $secret = base32Decode($secret);
    $time = floor($time / $timeStep);
    $time = pack('N*', 0) . pack('N*', $time);
    
    $hash = hash_hmac('sha1', $time, $secret, true);
    $offset = ord($hash[19]) & 0xF;
    $code = (
        ((ord($hash[$offset]) & 0x7F) << 24) |
        ((ord($hash[$offset + 1]) & 0xFF) << 16) |
        ((ord($hash[$offset + 2]) & 0xFF) << 8) |
        (ord($hash[$offset + 3]) & 0xFF)
    ) % 1000000;
    
    return str_pad($code, 6, '0', STR_PAD_LEFT);
}

// 验证 TOTP 码
function verifyTOTP($secret, $code, $window = 1) {
    for ($i = -$window; $i <= $window; $i++) {
        $expected = generateTOTP($secret, 30, time() + ($i * 30));
        if (hash_equals($expected, $code)) {
            return true;
        }
    }
    return false;
}

// 获取存储的密钥
function getStoredSecret() {
    global $SECRET_FILE;
    if (file_exists($SECRET_FILE)) {
        return trim(file_get_contents($SECRET_FILE));
    }
    return null;
}

// 保存密钥
function saveSecret($secret) {
    global $SECRET_FILE;
    return file_put_contents($SECRET_FILE, $secret) !== false;
}

// 生成二维码 URL (用于 Google Authenticator)
function getQRCodeUrl($label, $secret, $issuer = 'WheatAlbum') {
    return 'otpauth://totp/' . urlencode($label) . '?secret=' . $secret . '&issuer=' . urlencode($issuer);
}

// API 接口
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'status':
        // 获取2FA状态
        $secret = getStoredSecret();
        echo json_encode([
            'success' => true,
            'enabled' => !empty($secret),
            'secret' => $secret ? substr($secret, 0, 4) . '****' : null
        ]);
        break;
        
    case 'setup':
        // 生成新的密钥（用于后台设置）
        $secret = generateSecret();
        
        echo json_encode([
            'success' => true,
            'secret' => $secret,
            'qr_url' => getQRCodeUrl('admin@wheat-album', $secret)
        ]);
        break;
        
    case 'verify_setup':
        // 验证并保存设置
        $code = $_POST['code'] ?? '';
        $secret = $_POST['secret'] ?? '';
        
        if (empty($secret) || strlen($secret) !== 32) {
            echo json_encode(['success' => false, 'message' => '密钥无效']);
            break;
        }
        
        if (!preg_match('/^\d{6}$/', $code)) {
            echo json_encode(['success' => false, 'message' => '验证码格式错误']);
            break;
        }
        
        if (verifyTOTP($secret, $code)) {
            if (saveSecret($secret)) {
                echo json_encode(['success' => true, 'message' => '两步验证设置成功']);
            } else {
                echo json_encode(['success' => false, 'message' => '保存失败']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => '验证码错误，请重试']);
        }
        break;
        
    case 'verify':
        // 登录时验证
        $code = $_POST['code'] ?? '';
        $secret = getStoredSecret();
        
        if (empty($secret)) {
            // 未设置2FA，直接通过
            echo json_encode(['success' => true]);
            break;
        }
        
        if (!preg_match('/^\d{6}$/', $code)) {
            echo json_encode(['success' => false, 'message' => '验证码格式错误']);
            break;
        }
        
        if (verifyTOTP($secret, $code)) {
            $_SESSION['2fa_verified'] = true;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => '验证码错误']);
        }
        break;
        
    case 'disable':
        // 禁用2FA
        global $SECRET_FILE;
        if (file_exists($SECRET_FILE)) {
            unlink($SECRET_FILE);
        }
        echo json_encode(['success' => true, 'message' => '两步验证已禁用']);
        break;
        
    case 'get_code':
        // 用于测试：获取当前应该输入的验证码
        $secret = getStoredSecret();
        if ($secret) {
            echo json_encode([
                'success' => true,
                'code' => generateTOTP($secret),
                'secret' => $secret
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => '未设置2FA']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => '未知操作']);
}
