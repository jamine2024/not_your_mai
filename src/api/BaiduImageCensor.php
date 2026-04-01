<?php
/**
 * 百度图片内容审核类
 */
class BaiduImageCensor
{
    private $config;
    private $accessToken;
    private $tokenFile;

    public function __construct()
    {
        $this->config = require 'baidu_censor_config.php';
        $this->tokenFile = __DIR__ . '/baidu_token.cache';
        $this->accessToken = $this->getAccessToken();
    }

    /**
     * 获取Access Token
     */
    private function getAccessToken()
    {
        // 检查缓存的token
        if (file_exists($this->tokenFile)) {
            $cache = json_decode(file_get_contents($this->tokenFile), true);
            if ($cache && $cache['expire_time'] > time()) {
                return $cache['access_token'];
            }
        }

        // 重新获取token
        $url = $this->config['token_url'];
        $params = [
            'grant_type' => 'client_credentials',
            'client_id' => $this->config['api_key'],
            'client_secret' => $this->config['secret_key']
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            error_log('获取百度AccessToken失败: HTTP ' . $httpCode);
            return null;
        }

        $data = json_decode($response, true);
        if (!isset($data['access_token'])) {
            error_log('获取百度AccessToken失败: ' . $response);
            return null;
        }

        // 缓存token
        $cache = [
            'access_token' => $data['access_token'],
            'expire_time' => time() + ($data['expires_in'] ?? 3600) - 300
        ];
        file_put_contents($this->tokenFile, json_encode($cache));

        return $data['access_token'];
    }

    /**
     * 审核图片
     * @param string $imagePath 图片路径或URL
     * @return array ['success' => bool, 'is_violation' => bool, 'message' => string, 'data' => array]
     */
    public function censor($imagePath)
    {
        if (!$this->accessToken) {
            return [
                'success' => false,
                'is_violation' => false,
                'message' => '百度审核服务未配置',
                'data' => null
            ];
        }

        // 判断是URL还是本地文件
        if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
            $imgBase64 = base64_encode(file_get_contents($imagePath));
        } else {
            if (!file_exists($imagePath)) {
                return [
                    'success' => false,
                    'is_violation' => false,
                    'message' => '图片文件不存在',
                    'data' => null
                ];
            }
            $imgBase64 = base64_encode(file_get_contents($imagePath));
        }

        $url = $this->config['api_url'] . '?access_token=' . $this->accessToken;

        $params = [
            'image' => $imgBase64,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return [
                'success' => false,
                'is_violation' => false,
                'message' => '审核请求失败: HTTP ' . $httpCode,
                'data' => null
            ];
        }

        $result = json_decode($response, true);
        if (!isset($result['conclusion'])) {
            return [
                'success' => false,
                'is_violation' => false,
                'message' => '审核结果解析失败',
                'data' => $result
            ];
        }

        // 解析审核结果
        $isViolation = $result['conclusion'] !== '合规';
        $violationTypes = [];

        if ($isViolation && isset($result['data'])) {
            foreach ($result['data'] as $item) {
                if (isset($item['msg'])) {
                    $violationTypes[] = $item['msg'];
                }
            }
        }

        return [
            'success' => true,
            'is_violation' => $isViolation,
            'message' => $isViolation ? '图片包含违规内容: ' . implode(', ', $violationTypes) : '审核通过',
            'data' => $result
        ];
    }

    /**
     * 检查配置是否有效
     */
    public function isConfigured()
    {
        // 检查是否启用
        if (empty($this->config['enabled']) || $this->config['enabled'] !== true) {
            return false;
        }

        return !empty($this->config['api_key']) &&
               $this->config['api_key'] !== 'YOUR_API_KEY_HERE' &&
               !empty($this->config['secret_key']) &&
               $this->config['secret_key'] !== 'YOUR_SECRET_KEY_HERE';
    }
}
